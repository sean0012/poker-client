<script lang="ts">
  import { onMount, untrack } from 'svelte';

  let { chips }: { chips: number } = $props();

  type Point = { x: number; y: number };
  type Move = { stack: number; count: number };
  type Grip = Move & { origin: Point; anchor: Point; position: Point; dragging: boolean };
  type Flight = { count: number; from: Point; to: Point; kind: 'throw' | 'place' | 'undo'; source?: Move };

  // Store only changed stacks so large chip balances do not allocate huge arrays.
  let bank = $state(untrack(() => chips));
  const stackSize = 10;
  let removed = $state<Record<number, number>>({});
  let moves = $state<Move[]>([]);
  let confirmed = $state(0);
  let page = $state(0);
  let keyboardStack = 0;
  let selected = $state<Move | null>(null);
  let grip = $state<Grip | null>(null);
  let flight = $state<Flight | null>(null);
  let progress = $state(0);
  let notice = $state('Choose chips from a stack.');
  let canvas: HTMLCanvasElement;
  let width = $state(640);
  let pixelRatio = $state(1);
  let frame = 0;
  let reducedMotion = false;
  const height = 380;
  const step = 7;
  const baseY = 320;
  const pointers = new Map<number, Point>();
  let primaryTouch: number | null = null;
  let suppressTouch = false;

  const pending = $derived(moves.reduce((sum, move) => sum + move.count, 0));
  const available = $derived(bank - Object.values(removed).reduce((sum, count) => sum + count, 0));
  const stackCount = $derived(Math.ceil(bank / stackSize));
  const pages = $derived(Math.max(1, Math.ceil(stackCount / 3)));
  const busy = $derived(grip !== null || flight !== null);
  const zone = $derived({ x: width / 2, y: 88 });

  function countAt(index: number) {
    return Math.max(0, Math.min(stackSize, bank - index * stackSize) - (removed[index] ?? 0));
  }

  function stackPoint(index: number): Point {
    return { x: width * ((index % 3) + 0.5) / 3, y: baseY };
  }

  function point(event: PointerEvent): Point {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * width / rect.width, y: (event.clientY - rect.top) * height / rect.height };
  }

  function pick(position: Point) {
    if (busy) return;
    for (let slot = 0; slot < 3; slot++) {
      const stack = page * 3 + slot;
      const count = countAt(stack);
      const center = stackPoint(stack);
      if (count && Math.abs(position.x - center.x) <= 38 && position.y >= baseY - (count - 1) * step - 12 && position.y <= baseY + 12) {
        // Keep the current selection around a boundary to prevent pointer jitter.
        if (selected?.stack === stack) {
          const boundary = baseY - (count - selected.count) * step;
          if (Math.abs(position.y - boundary) < step / 2 + 2) return;
        }
        selected = { stack, count: Math.max(1, Math.min(count, count - Math.round((baseY - position.y) / step))) };
        return;
      }
    }
    selected = null;
  }

  function grab(anchor: Point) {
    if (!selected || !countAt(selected.stack) || flight) return;
    const origin = stackPoint(selected.stack);
    origin.y -= (countAt(selected.stack) - selected.count) * step;
    grip = { ...selected, origin, anchor, position: origin, dragging: false };
  }

  function inZone(position: Point) {
    return Math.abs(position.x - zone.x) < width * 0.43 && position.y >= 16 && position.y <= 160;
  }

  function animate(next: Flight, done: () => void) {
    flight = next;
    progress = 0;
    const start = performance.now();
    const duration = reducedMotion ? 1 : next.kind === 'throw' ? 400 : 240;
    const tick = (now: number) => {
      progress = Math.min(1, (now - start) / duration);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else {
        flight = null;
        done();
      }
    };
    frame = requestAnimationFrame(tick);
  }

  function deposit(move: Move, from: Point, kind: 'throw' | 'place') {
    selected = null;
    removed = { ...removed, [move.stack]: (removed[move.stack] ?? 0) + move.count };
    animate({ count: move.count, from, to: { x: zone.x, y: 118 }, kind }, () => {
      moves = [...moves, move];
      notice = `${move.count} chips added. ${pending} chips pending.`;
    });
  }

  function release() {
    const held = grip;
    grip = null;
    if (!held) return;
    if (!held.dragging || inZone(held.position)) {
      deposit({ stack: held.stack, count: held.count }, held.position, held.dragging ? 'place' : 'throw');
    } else {
      selected = null;
      animate({ count: held.count, from: held.position, to: held.origin, kind: 'undo', source: { stack: held.stack, count: held.count } }, () => {
        notice = 'Move cancelled.';
      });
    }
  }

  function pointerDown(event: PointerEvent) {
    if (flight || (event.pointerType !== 'touch' && event.button !== 0)) return;
    if (event.pointerType === 'touch' && pointers.size >= 2) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    const position = point(event);
    pointers.set(event.pointerId, position);
    if (event.pointerType === 'touch') {
      if (suppressTouch) return;
      if (pointers.size === 1) {
        primaryTouch = event.pointerId;
        pick(position);
      } else if (pointers.size === 2 && selected) {
        const points = [...pointers.values()];
        grab({ x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 });
      }
    } else {
      pick(position);
      grab(position);
    }
  }

  function pointerMove(event: PointerEvent) {
    const position = point(event);
    if (pointers.has(event.pointerId)) pointers.set(event.pointerId, position);
    if (flight || suppressTouch) return;
    if (grip) {
      let anchor = position;
      if (event.pointerType === 'touch') {
        if (pointers.size !== 2) return;
        const points = [...pointers.values()];
        anchor = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
      }
      const dx = anchor.x - grip.anchor.x;
      const dy = anchor.y - grip.anchor.y;
      grip = { ...grip, dragging: grip.dragging || Math.hypot(dx, dy) > 8, position: { x: grip.origin.x + dx, y: grip.origin.y + dy } };
    } else if (event.pointerType !== 'touch' || event.pointerId === primaryTouch) {
      pick(position);
    }
  }

  function pointerUp(event: PointerEvent) {
    if (!pointers.has(event.pointerId)) return;
    if (grip) release();
    pointers.delete(event.pointerId);
    if (event.pointerType === 'touch') {
      selected = null;
      suppressTouch = pointers.size > 0;
      if (!pointers.size) {
        primaryTouch = null;
        suppressTouch = false;
      }
    }
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  }

  function cancel() {
    grip = null;
    selected = null;
    primaryTouch = null;
    const ids = [...pointers.keys()];
    pointers.clear();
    suppressTouch = false;
    for (const id of ids) if (canvas?.hasPointerCapture(id)) canvas.releasePointerCapture(id);
  }

  function undo() {
    if (busy || !moves.length) return;
    const move = moves[moves.length - 1];
    moves = moves.slice(0, -1);
    page = Math.floor(move.stack / 3);
    selected = null;
    const target = stackPoint(move.stack);
    target.y -= countAt(move.stack) * step;
    animate({ count: move.count, from: { x: zone.x, y: 118 }, to: target, kind: 'undo' }, () => {
      removed = { ...removed, [move.stack]: removed[move.stack] - move.count };
      notice = `${move.count} chips returned. ${pending} chips pending.`;
    });
  }

  function confirm() {
    if (busy || !pending) return;
    const amount = pending;
    confirmed += amount;
    moves = [];
    selected = null;
    notice = `${amount} chips confirmed locally.`;
  }

  function changePage(delta: number) {
    page = Math.max(0, Math.min(pages - 1, page + delta));
    keyboardStack = page * 3;
    selected = null;
  }

  function keyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') { cancel(); return; }
    if (busy || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    let stack = selected?.stack ?? keyboardStack;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      stack = Math.max(0, Math.min(stackCount - 1, stack + (event.key === 'ArrowRight' ? 1 : -1)));
      page = Math.floor(stack / 3);
      keyboardStack = stack;
      selected = countAt(stack) ? { stack, count: 1 } : null;
    } else if (event.key === 'Enter' || event.key === ' ') {
      if (selected) {
        const origin = stackPoint(selected.stack);
        origin.y -= (countAt(selected.stack) - selected.count) * step;
        deposit(selected, origin, 'throw');
      }
    } else {
      const count = Math.max(1, Math.min(countAt(stack), (selected?.count ?? 1) + (event.key === 'ArrowDown' ? 1 : -1)));
      selected = countAt(stack) ? { stack, count } : null;
    }
  }

  function draw() {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    ctx.scale(pixelRatio, pixelRatio);
    ctx.clearRect(0, 0, width, height);

    function label(text: string, x: number, y: number, color = '#b9d2c5', size = 12) {
      ctx!.font = `500 ${size}px system-ui, sans-serif`;
      ctx!.textAlign = 'center';
      ctx!.fillStyle = color;
      ctx!.fillText(text, x, y);
    }

    function stack(x: number, y: number, count: number, lit = 0, alpha = 1, gold = false) {
      ctx!.save();
      ctx!.globalAlpha = alpha;
      for (let i = 0; i < count; i++) {
        const bright = i >= count - lit;
        const cy = y - i * step - (lit > 0 && bright ? 3 : 0);
        ctx!.fillStyle = gold ? '#b8893d' : bright ? '#a5f3d0' : '#398a76';
        ctx!.fillRect(x - 30, cy - 3, 60, step);
        ctx!.fillStyle = gold ? '#f7dc91' : bright ? '#e5fff1' : '#83c9b0';
        ctx!.fillRect(x - 30, cy - 3, 60, 1);
        ctx!.fillStyle = '#e8e5cd';
        for (const offset of [-21, -3, 15]) ctx!.fillRect(x + offset, cy - 2, 5, 4);
        ctx!.fillStyle = '#10392f';
        ctx!.fillRect(x - 30, cy + 3, 60, 1);
        if ((i + 1) % 5 === 0) {
          ctx!.strokeStyle = '#f6e6ae';
          ctx!.beginPath(); ctx!.moveTo(x - 27, cy + 4); ctx!.lineTo(x + 27, cy + 4); ctx!.stroke();
        }
      }
      ctx!.restore();
    }

    const active = grip?.dragging && inZone(grip.position);
    ctx.fillStyle = active ? '#29584a' : '#193d33';
    ctx.strokeStyle = pending || active ? '#dfc888' : '#618174';
    ctx.lineWidth = active ? 2 : 1;
    ctx.setLineDash(pending ? [5, 5] : []);
    ctx.beginPath(); ctx.roundRect(width * 0.07, 16, width * 0.86, 144, 24); ctx.fill(); ctx.stroke();
    ctx.setLineDash([]);
    label(active ? 'RELEASE TO PLACE' : 'BETTING ZONE', zone.x, 40, '#e5d5a6');
    if (pending) {
      stack(zone.x, 118, Math.min(pending, 10), 0, 1, true);
      label(`${pending} pending`, zone.x, 147, '#f8e8bc');
    } else {
      label(confirmed ? `${confirmed} confirmed locally` : 'Toss or place your chips here', zone.x, 108);
    }

    for (let slot = 0; slot < 3; slot++) {
      const index = page * 3 + slot;
      if (index >= stackCount) continue;
      const origin = stackPoint(index);
      const count = countAt(index);
      const held = grip?.stack === index ? grip.count : flight?.source?.stack === index ? flight.source.count : 0;
      stack(origin.x, baseY, count - held, selected?.stack === index && !grip ? selected.count : 0);
    }
    if (grip) stack(grip.position.x, grip.position.y - 10, grip.count, grip.count);
    if (flight) {
      const t = 1 - Math.pow(1 - progress, 3);
      const x = flight.from.x + (flight.to.x - flight.from.x) * t;
      const y = flight.from.y + (flight.to.y - flight.from.y) * t - (flight.kind === 'throw' ? Math.sin(Math.PI * progress) * 80 : 0);
      stack(x, y, flight.count, flight.count);
    }
  }

  $effect(() => { draw(); });

  onMount(() => {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observer = new ResizeObserver(([entry]) => {
      width = Math.max(1, entry.contentRect.width);
      pixelRatio = window.devicePixelRatio || 1;
      cancel();
    });
    observer.observe(canvas);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  });
</script>

<svelte:window onblur={cancel} />

<div class="chip-table">
  <div class="heading">
    <div><span class="balance">{available} available · {confirmed} confirmed locally</span></div>
    <span class="selection" aria-live="polite">{grip ? `Holding ${grip.count}` : selected ? `${selected.count} selected` : ''}</span>
  </div>
  <canvas
    bind:this={canvas}
    tabindex="0"
    role="button"
    aria-label="Chip table"
    onpointerdown={pointerDown}
    onpointermove={pointerMove}
    onpointerup={pointerUp}
    onpointercancel={cancel}
    onlostpointercapture={(event) => { if (pointers.has(event.pointerId)) cancel(); }}
    onpointerleave={() => { if (!grip && !pointers.size) selected = null; }}
    onkeydown={keyDown}
  >Use the arrow keys to choose chips and Enter to move them to the betting zone.</canvas>
  <div class="stack-tools">
    {#if pages > 1}
      <div class="pagination">
        <button aria-label="Previous stacks" onclick={() => changePage(-1)} disabled={busy || page === 0}>←</button>
        <span>{page + 1} / {pages}</span>
        <button aria-label="Next stacks" onclick={() => changePage(1)} disabled={busy || page === pages - 1}>→</button>
      </div>
    {/if}
  </div>
  <div class="bet-actions">
    <span class="pending">Pending <strong>{pending}</strong></span>
    <button onclick={undo} disabled={busy || !moves.length}>Undo</button>
    <button class="confirm" onclick={confirm} disabled={busy || !pending}>Confirm bet · {pending}</button>
  </div>
  <p class="notice" role="status">{notice}</p>
</div>

<style>
  .chip-table { margin-top: 20px; padding: 16px; border-radius: 18px; background: #102e25; color: #f1f5e9; }
  .heading, .stack-tools, .bet-actions, .pagination { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .heading, .stack-tools { justify-content: space-between; }
  .balance, .selection { font-size: 12px; color: #b9d2c5; }
  .selection { color: #d7fbe5; }
  canvas { display: block; width: 100%; height: 380px; touch-action: none; cursor: grab; border-radius: 12px; }
  canvas:active { cursor: grabbing; }
  canvas:focus-visible, button:focus-visible { outline: 2px solid #f7dc91; outline-offset: 3px; }
  .pagination { gap: 8px; font-size: 12px; }
  button { min-height: 44px; border: 1px solid #749488; border-radius: 8px; padding: 8px 14px; background: #22483a; color: inherit; font: inherit; cursor: pointer; }
  button:disabled { opacity: 0.4; cursor: default; }
  .bet-actions { margin-top: 16px; padding-top: 16px; border-top: 1px solid #39574a; }
  .pending { flex: 1; font-size: 14px; }
  .pending strong { margin-left: 6px; font-size: 22px; }
  .confirm { background: #e7d6a2; border-color: #e7d6a2; color: #203c30; font-weight: 600; }
  .notice { font-size: 12px; color: #b9d2c5; line-height: 1.6; }
  .notice { min-height: 20px; }
  @media (max-width: 420px) { .chip-table { padding: 10px; } .bet-actions { gap: 8px; } .bet-actions button { padding: 8px 10px; font-size: 13px; } }
</style>
