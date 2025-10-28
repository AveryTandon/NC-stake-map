// Deterministic offset for nodes with same power/alignment
function getStableOffset(nodeId, maxRadius = 20) {
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
export function getNodePosition(node, existingRects, canvasWidth, canvasHeight, padding, width, height) {
  const tickInset = 40;

  // Base x/y according to alignment (x) and power (y)
  const xBase = padding + tickInset + ((node.alignment - 1) * (canvasWidth - 2 * padding - tickInset) / 9);
  const yBase = canvasHeight - padding - tickInset - ((node.power - 1) * (canvasHeight - 2 * padding - tickInset) / 9);

  // Start with deterministic jitter
  let { dx, dy } = getStableOffset(node.id);

  let x = xBase + dx;
  let y = yBase + dy;

  // Try to avoid overlaps by spiraling out if needed
  let spiralStep = 5;
  let spiralAngle = 0;
  const spiralIncrement = Math.PI / 6; // 30 degrees per iteration
  const maxAttempts = 100;

  let attempts = 0;
  while (
    existingRects.some((r) => overlaps({ x, y, width, height }, r)) &&
    attempts < maxAttempts
  ) {
    spiralAngle += spiralIncrement;
    const radius = spiralStep * (attempts + 1);
    x = xBase + radius * Math.cos(spiralAngle);
    y = yBase + radius * Math.sin(spiralAngle);
    attempts++;
  }

  return { x, y };
}

export function getPowerAlignmentFromPosition(x, y, canvasWidth, canvasHeight, padding, tickInset = 40) {
  // alignment (x-axis)
  const alignment = 1 + ((x - padding - tickInset) * 9) / (canvasWidth - 2 * padding - tickInset);
  // power (y-axis)
  const power = 1 + ((canvasHeight - padding - tickInset - y) * 9) / (canvasHeight - 2 * padding - tickInset);

  return {
    alignment: Math.min(Math.max(alignment, 1), 10),
    power: Math.min(Math.max(power, 1), 10)
  };
}