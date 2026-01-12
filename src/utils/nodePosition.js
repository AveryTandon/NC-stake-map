// Get node position in pixels on the canvas
// Nodes are positioned based on their power (y-axis) and alignment (x-axis) values
// Nodes with the same power/alignment values stack at the same position and can be expanded
export function getNodePosition(node, existingRects, canvasWidth, canvasHeight, sidePadding, bottomPadding, tickInset, width, height, existingNodes = []) {
  // Base x/y according to alignment (x) and power (y)
  // X axis: matches tick mark positioning exactly (no tickInset offset)
  const xRange = canvasWidth - 2 * sidePadding;
  const xBase = sidePadding + ((node.alignment + 5) * (xRange / 10));
  // Y axis: matches tick mark positioning - uses bottomPadding for bottom, range is (canvasHeight - bottomPadding)
  const yRange = canvasHeight - bottomPadding;
  const yBase = canvasHeight - bottomPadding - tickInset - ((node.power - 1) * (yRange / 10));

  // Always return the base position - nodes will center exactly on tick marks
  // Nodes at the same power/alignment will stack exactly at the same position
  return { x: xBase, y: yBase };
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