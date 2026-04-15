// Parse Prometheus text exposition format into a usable map

export interface PrometheusMetric {
  name: string;
  labels: Record<string, string>;
  value: number;
}

export function parsePrometheus(text: string): PrometheusMetric[] {
  const metrics: PrometheusMetric[] = [];
  for (const line of text.split('\n')) {
    if (!line || line.startsWith('#')) continue;
    // Format: metric_name{label="val",...} value
    // or:    metric_name value
    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\{?(.*?)\}?\s+([\d.eE+-]+|NaN|Inf|\+Inf|-Inf)$/);
    if (!match) {
      // Simple metric without labels
      const simple = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\s+([\d.eE+-]+|NaN|Inf|\+Inf|-Inf)$/);
      if (simple) {
        metrics.push({ name: simple[1], labels: {}, value: parseFloat(simple[2]) });
      }
      continue;
    }
    const labels: Record<string, string> = {};
    if (match[2]) {
      for (const pair of match[2].split(',')) {
        const [k, v] = pair.split('=');
        if (k && v) labels[k.trim()] = v.replace(/"/g, '').trim();
      }
    }
    metrics.push({ name: match[1], labels, value: parseFloat(match[3]) });
  }
  return metrics;
}

export function getMetricValue(metrics: PrometheusMetric[], name: string, labels?: Record<string, string>): number {
  const found = metrics.find(m => {
    if (m.name !== name) return false;
    if (!labels) return true;
    return Object.entries(labels).every(([k, v]) => m.labels[k] === v);
  });
  return found?.value ?? 0;
}

export function getHistogramPercentile(
  metrics: PrometheusMetric[],
  baseName: string,
  percentile: number,
  labels?: Record<string, string>
): number {
  const bucketName = `${baseName}_bucket`;
  const countName = `${baseName}_count`;
  
  const buckets = metrics
    .filter(m => {
      if (m.name !== bucketName) return false;
      if (!labels) return true;
      return Object.entries(labels).every(([k, v]) => m.labels[k] === v);
    })
    .map(m => ({ le: parseFloat(m.labels.le || 'Inf'), count: m.value }))
    .filter(b => !isNaN(b.le))
    .sort((a, b) => a.le - b.le);

  const total = getMetricValue(metrics, countName, labels);
  if (total === 0 || buckets.length === 0) return 0;

  const target = total * (percentile / 100);
  for (let i = 0; i < buckets.length; i++) {
    if (buckets[i].count >= target) {
      return buckets[i].le;
    }
  }
  return buckets[buckets.length - 1]?.le ?? 0;
}
