import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

/** Thin React wrapper around ECharts with auto-resize. */
export default function EChart({ option, height = 300 }) {
  const domRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    chartRef.current = echarts.init(domRef.current);
    const onResize = () => chartRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return <div ref={domRef} style={{ width: '100%', height }} />;
}

export const PALETTE = ['#1e3a8a', '#2563eb', '#0ea5e9', '#7dd3fc', '#93c5fd', '#f59e0b', '#10b981', '#64748b'];
