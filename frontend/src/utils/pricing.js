/**
 * Pricing calculation utility per brief specifications:
 * - GPU rate: rate[hardware] * gpuCount
 * - CPU rate: 0.00000659 * vCPU
 * - Memory rate: 0.00000222 * GB
 * - Total per second: sum of all three
 * - Monthly estimate: totalPerSec * runtimeSeconds * requests
 */

export function calculatePricing({
  hardwareRate = 0.000306,
  gpuCount = 1,
  vcpuCount = 4,
  memoryGb = 8,
  runtimeSeconds = 2,
  requests = 636435,
}) {
  const gpuCostPerSec = hardwareRate * (hardwareRate > 0 ? gpuCount : 0);
  const cpuCostPerSec = 0.00000659 * vcpuCount;
  const memoryCostPerSec = 0.00000222 * memoryGb;

  const totalCostPerSec = gpuCostPerSec + cpuCostPerSec + memoryCostPerSec;
  const monthlyCost = totalCostPerSec * runtimeSeconds * requests;

  return {
    gpuCostPerSec,
    cpuCostPerSec,
    memoryCostPerSec,
    totalCostPerSec,
    monthlyCost,
  };
}

export function formatCurrency(value, decimals = 2) {
  if (decimals > 2) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

