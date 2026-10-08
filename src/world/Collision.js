// Simple, allocation-free collision helpers.
// Solids are axis-aligned boxes: { x0, y0, x1, y1, owner }  (owner may have hit(damage, dirX, dirY))

/** Push a circle (body.x, body.y, r) out of a box. Returns true if they overlapped. */
export function pushCircleOutOfBox(body, r, box) {
  const cx = Math.max(box.x0, Math.min(body.x, box.x1));
  const cy = Math.max(box.y0, Math.min(body.y, box.y1));
  let dx = body.x - cx;
  let dy = body.y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= r * r) return false;
  if (d2 > 1e-6) {
    const d = Math.sqrt(d2);
    const push = r - d;
    body.x += (dx / d) * push;
    body.y += (dy / d) * push;
  } else {
    // centre is inside the box: push out along the shallowest side
    const left = body.x - box.x0;
    const right = box.x1 - body.x;
    const down = body.y - box.y0;
    const up = box.y1 - body.y;
    const m = Math.min(left, right, down, up);
    if (m === left) body.x = box.x0 - r;
    else if (m === right) body.x = box.x1 + r;
    else if (m === down) body.y = box.y0 - r;
    else body.y = box.y1 + r;
  }
  return true;
}

export function pointInBox(x, y, box, pad = 0) {
  return x >= box.x0 - pad && x <= box.x1 + pad && y >= box.y0 - pad && y <= box.y1 + pad;
}

/** Keep a circle inside a rectangle (the room's walkable floor). */
export function clampCircleToRect(body, r, rect) {
  body.x = Math.max(rect.x0 + r, Math.min(rect.x1 - r, body.x));
  body.y = Math.max(rect.y0 + r, Math.min(rect.y1 - r, body.y));
}
