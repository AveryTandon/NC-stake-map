// Deterministic offset for nodes with same power/alignment
function getStableOffset(nodeId, maxRadius = 5) {
  // Make a numeric seed from node id string
  let hash = 0;
  const str = String(nodeId);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const angle = (hash % 360) * (Math.PI / 180);
  const radius = ((hash % maxRadius) + 1);
  return {
    dx: Math.cos(angle) * radius,
    dy: Math.sin(angle) * radius,
  };
}

// Check if two rectangles overlap
function overlaps(rect1, rect2) {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect1.x > rect2.x + rect2.width ||
    rect1.y + rect1.height < rect2.y ||
    rect1.y > rect2.y + rect2.height
  );
}

// Get node position in pixels on the canvas
export function getNodePosition(node, existingRects, canvasWidth, canvasHeight, sidePadding, bottomPadding, tickInset, width, height) {
  // Base x/y according to alignment (x) and power (y)
  // X axis: matches tick mark positioning exactly (no tickInset offset)
  const xRange = canvasWidth - 2 * sidePadding;
  const xBase = sidePadding + ((node.alignment + 5) * (xRange / 10));
  // Y axis: matches tick mark positioning - uses bottomPadding for bottom, range is (canvasHeight - bottomPadding)
  const yRange = canvasHeight - bottomPadding;
  const yBase = canvasHeight - bottomPadding - tickInset - ((node.power - 1) * (yRange / 10));

  // Start centered on tick mark (no jitter initially)
  let x = xBase;
  let y = yBase;

  // Check if there are any collisions at the base position
  const baseRect = { x: x - width / 2, y: y - height / 2, width, height };
  const hasCollision = existingRects.some((r) => overlaps(baseRect, r));

  // Only apply jitter/spiraling if there are collisions
  if (hasCollision && existingRects.length > 0) {
    // Start with deterministic jitter for nodes at same position
    let { dx, dy } = getStableOffset(node.id);
    x = xBase + dx;
    y = yBase + dy;

    // Try to avoid overlaps by spiraling out if needed
    let spiralStep = 2;
    let spiralAngle = 0;
    const spiralIncrement = Math.PI / 6; // 30 degrees per iteration
    const maxAttempts = 100;

    let attempts = 0;
    while (
      existingRects.some((r) => overlaps({ x: x - width / 2, y: y - height / 2, width, height }, r)) &&
      attempts < maxAttempts
    ) {
      spiralAngle += spiralIncrement;
      const radius = spiralStep * (attempts + 1);
      x = xBase + radius * Math.cos(spiralAngle);
      y = yBase + radius * Math.sin(spiralAngle);
      attempts++;
    }
  }

  return { x, y };
}

export function getPowerAlignmentFromPosition(x, y, canvasWidth, canvasHeight, sidePadding, bottomPadding, tickInset) {
  // alignment (x-axis) - matches tick mark calculation (no tickInset offset)
  const xRange = canvasWidth - 2 * sidePadding;
  const alignment = -5 + ((x - sidePadding) * 10) / xRange;
  // power (y-axis) - matches tick mark calculation
  const yRange = canvasHeight - bottomPadding;
  const power = 1 + ((canvasHeight - bottomPadding - tickInset - y) * 10) / yRange;

  return {
    alignment: Math.min(Math.max(alignment, -5), 5),
    power: Math.min(Math.max(power, 1), 10)
  };
}