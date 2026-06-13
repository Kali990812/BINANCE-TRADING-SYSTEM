import React, { useState, useRef, useEffect } from 'react';
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { Candle, Coin } from '../types';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, Eye, EyeOff, BarChart2, AreaChart } from 'lucide-react';

interface TradingChartProps {
  candles: Candle[];
  coin: Coin;
}

export const TradingChart: React.FC<TradingChartProps> = ({ candles, coin }) => {
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '1D'>('15m');
  const [chartMode, setChartMode] = useState<'lightweight' | 'svg'>('lightweight');
  const [showMa, setShowMa] = useState(true);
  const [showRsi, setShowRsi] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(30); // number of candles to show for SVG mode

  // Sizing tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const lightweightContainerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 });

  // Lightweight Charts instances
  const chartInstanceRef = useRef<any>(null);
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  // Mouse interactivity state for Classic SVG Crosshair
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Track resizing of container correctly
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 300),
          height: Math.max(height, 300),
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // 1. Initialize Lightweight Chart Engine
  useEffect(() => {
    if (chartMode !== 'lightweight' || !lightweightContainerRef.current) return;

    // Remove any previous instance safely
    if (chartInstanceRef.current) {
      try {
        chartInstanceRef.current.remove();
      } catch (err) {
        console.error('Error removing lightweight-charts instance:', err);
      }
      chartInstanceRef.current = null;
    }

    // Create fresh instance
    const chart: any = createChart(lightweightContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#161a1e' },
        textColor: '#9ea3ae',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(43, 49, 57, 0.4)' },
        horzLines: { color: 'rgba(43, 49, 57, 0.4)' },
      },
      rightPriceScale: {
        borderColor: '#2b3139',
        visible: true,
      },
      timeScale: {
        borderColor: '#2b3139',
        timeVisible: true,
        secondsVisible: false,
      },
      width: dimensions.width,
      height: dimensions.height - 40, // offset controls block
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderVisible: false,
      wickUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Overlay volume on the main price area
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8, // Vol occupies the bottom 20%
        bottom: 0,
      },
    });

    chartInstanceRef.current = chart;
    candleSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    // Seed data
    syncLightweightChartData();

    chart.timeScale().fitContent();

    return () => {
      if (chartInstanceRef.current) {
        try {
          chartInstanceRef.current.remove();
        } catch (e) {}
        chartInstanceRef.current = null;
      }
    };
  }, [chartMode, coin.symbol]);

  // 2. Synchronize dimensions
  useEffect(() => {
    if (chartInstanceRef.current && chartMode === 'lightweight') {
      chartInstanceRef.current.resize(dimensions.width, dimensions.height - 40);
    }
  }, [dimensions, chartMode]);

  // Helper to update lightweight chart data
  const syncLightweightChartData = () => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) return;

    const chartData = candles.map((c, idx) => {
      const timeVal = c.timestamp || (Math.floor(Date.now() / 1000) - (candles.length - idx) * 15 * 60);
      return {
        time: timeVal,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      };
    });

    const volumeData = candles.map((c, idx) => {
      const timeVal = c.timestamp || (Math.floor(Date.now() / 1000) - (candles.length - idx) * 15 * 60);
      const isUp = c.close >= c.open;
      return {
        time: timeVal,
        value: c.volume,
        color: isUp ? 'rgba(14, 203, 129, 0.4)' : 'rgba(246, 70, 93, 0.4)',
      };
    });

    try {
      candleSeriesRef.current.setData(chartData);
      volumeSeriesRef.current.setData(volumeData);
    } catch (err) {
      console.error('Error synchronizing lightweight-charts data:', err);
    }
  };

  // Sync data whenever candles slice propagates
  useEffect(() => {
    if (chartMode === 'lightweight') {
      syncLightweightChartData();
    }
  }, [candles, chartMode]);


  // ==============================================================
  // CLASSIC SVG VECTOR CHART CALCULATIONS (As dynamic fallback view)
  // ==============================================================
  const visibleCandles = candles.slice(-zoomLevel);

  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let maxVolume = 0;

  visibleCandles.forEach((c) => {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
    if (c.volume > maxVolume) maxVolume = c.volume;
  });

  const calculateMA = (period: number, indexInVisible: number): number | null => {
    const actualIndex = candles.length - zoomLevel + indexInVisible;
    if (actualIndex < period - 1) return null;
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += candles[actualIndex - i].close;
    }
    return sum / period;
  };

  const calculateRSIValues = (): number[] => {
    const rsiList: number[] = [];
    let prevClose = candles[0]?.close || 1;
    let avgGain = 0;
    let avgLoss = 0;

    for (let j = 0; j < candles.length; j++) {
      const close = candles[j].close;
      const change = close - prevClose;
      let gain = change > 0 ? change : 0;
      let loss = change < 0 ? -change : 0;

      if (j < 14) {
        avgGain += gain;
        avgLoss += loss;
        rsiList.push(50);
      } else if (j === 14) {
        avgGain = avgGain / 14;
        avgLoss = avgLoss / 14;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsiList.push(100 - 100 / (1 + rs));
      } else {
        avgGain = (avgGain * 13 + gain) / 14;
        avgLoss = (avgLoss * 13 + loss) / 14;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsiList.push(100 - 100 / (1 + rs));
      }
      prevClose = close;
    }
    return rsiList.slice(-zoomLevel);
  };

  const rsiValues = calculateRSIValues();

  const priceRange = maxPrice - minPrice || 1;
  const paddingPct = 0.08;
  const chartMaxPrice = maxPrice + priceRange * paddingPct;
  const chartMinPrice = minPrice - priceRange * paddingPct;
  const chartPriceDiff = chartMaxPrice - chartMinPrice;

  const mainChartHeight = showRsi ? dimensions.height * 0.62 : dimensions.height * 0.85;
  const bottomChartHeight = dimensions.height - mainChartHeight - 40;
  const paddingX = 52;
  const chartWidth = dimensions.width - paddingX - 10;

  const getX = (index: number) => {
    return paddingX + (index / (zoomLevel - 1 || 1)) * chartWidth;
  };

  const getY = (price: number) => {
    return ((chartMaxPrice - price) / chartPriceDiff) * mainChartHeight + 15;
  };

  const getRsiY = (rsiVal: number) => {
    const rsiBaseY = mainChartHeight + 35;
    return rsiBaseY + ((100 - rsiVal) / 100) * bottomChartHeight;
  };

  const getVolHeight = (volume: number) => {
    return (volume / maxVolume) * (mainChartHeight * 0.2);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    setMousePos({ x: mouseX, y: mouseY });

    if (mouseX >= paddingX && mouseX <= dimensions.width - 10) {
      const relativeX = mouseX - paddingX;
      const indexFloat = (relativeX / chartWidth) * (zoomLevel - 1);
      const index = Math.min(zoomLevel - 1, Math.max(0, Math.round(indexFloat)));
      setHoverIndex(index);
    } else {
      setHoverIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activeCandleIndex = hoverIndex !== null ? hoverIndex : visibleCandles.length - 1;
  const activeCandle = visibleCandles[activeCandleIndex];
  const isUpCandle = activeCandle ? activeCandle.close >= activeCandle.open : true;

  const yTicks: number[] = [];
  const tickCount = 5;
  for (let i = 0; i < tickCount; i++) {
    const val = chartMaxPrice - (i * chartPriceDiff) / (tickCount - 1);
    yTicks.push(val);
  }

  let ma7Path = '';
  let ma25Path = '';

  visibleCandles.forEach((_, idx) => {
    const ma7Val = calculateMA(7, idx);
    const ma25Val = calculateMA(25, idx);

    if (ma7Val !== null) {
      const x = getX(idx);
      const y = getY(ma7Val);
      ma7Path += (ma7Path === '' ? 'M' : 'L') + `${x},${y}`;
    }

    if (ma25Val !== null) {
      const x = getX(idx);
      const y = getY(ma25Val);
      ma25Path += (ma25Path === '' ? 'M' : 'L') + `${x},${y}`;
    }
  });

  return (
    <div id="trading-chart-wrapper" className="bg-[#161a1e] border-b border-[#2b3139] flex flex-col flex-1 relative select-none">
      {/* Chart controls */}
      <div className="flex items-center justify-between border-b border-[#2b3139] px-4 py-2 bg-[#181d23] text-gray-400 flex-wrap gap-2">
        <div className="flex items-center gap-1">
          {/* Chart Engine Selector Tab Panels */}
          <button
            id="engine-lw-btn"
            onClick={() => setChartMode('lightweight')}
            className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer font-bold flex items-center gap-1 ${
              chartMode === 'lightweight'
                ? 'bg-yellow-500/10 text-[#f0b90b] border border-yellow-500/30'
                : 'hover:bg-[#1e2329] text-gray-400'
            }`}
          >
            <AreaChart size={12} />
            Interactive Pro
          </button>
          <button
            id="engine-svg-btn"
            onClick={() => setChartMode('svg')}
            className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer font-bold flex items-center gap-1 ${
              chartMode === 'svg'
                ? 'bg-yellow-500/10 text-[#f0b90b] border border-yellow-500/30'
                : 'hover:bg-[#1e2329] text-gray-400'
            }`}
          >
            <BarChart2 size={12} />
            Classic Vector
          </button>
        </div>

        <div className="flex items-center gap-1">
          {(['1m', '5m', '15m', '1h', '1D'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-2 py-0.5 rounded text-[10px] sm:text-xs transition-all cursor-pointer font-semibold ${
                timeframe === t
                  ? 'bg-[#2b3139] text-[#f0b90b]'
                  : 'hover:bg-[#1e2329] text-gray-400'
              }`}
            >
              {t}
            </button>
          ))}
          
          {chartMode === 'svg' && (
            <>
              <div className="h-4 w-[1px] bg-[#2b3139] mx-1.5" />
              <button
                id="toggle-ma-btn"
                onClick={() => setShowMa(!showMa)}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                  showMa ? 'bg-yellow-500/10 text-[#f0b90b]' : 'hover:bg-[#1e2329]'
                }`}
              >
                {showMa ? <Eye size={11} /> : <EyeOff size={11} />}
                MA
              </button>
              <button
                id="toggle-rsi-btn"
                onClick={() => setShowRsi(!showRsi)}
                className={`px-2 py-0.5 rounded text-[10px] sm:text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                  showRsi ? 'bg-[#0ecb81]/10 text-[#0ecb81]' : 'hover:bg-[#1e2329]'
                }`}
              >
                {showRsi ? <Eye size={11} /> : <EyeOff size={11} />}
                RSI
              </button>
              
              <div className="h-4 w-[1px] bg-[#2b3139] mx-1" />
              <button
                id="chart-zoom-in"
                onClick={() => setZoomLevel((z) => Math.max(15, z - 5))}
                className="p-1 hover:bg-[#2b3139] rounded text-gray-300 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={13} />
              </button>
              <button
                id="chart-zoom-out"
                onClick={() => setZoomLevel((z) => Math.min(80, z + 5))}
                className="p-1 hover:bg-[#2b3139] rounded text-gray-300 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Candlestick HUD info status line */}
      <div className="absolute top-15 left-[15px] z-10 px-2 py-1 text-[10px] font-mono select-none flex items-center gap-2 flex-wrap">
        <span className="text-[#f0b90b] font-bold">{coin.symbol}/USDT:</span>
        {activeCandle && (
          <>
            <span className="text-gray-400">
              O:{' '}
              <span className={isUpCandle ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>
                {activeCandle.open.toFixed(coin.decimals)}
              </span>
            </span>
            <span className="text-gray-400">
              H:{' '}
              <span className={isUpCandle ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>
                {activeCandle.high.toFixed(coin.decimals)}
              </span>
            </span>
            <span className="text-gray-400">
              L:{' '}
              <span className={isUpCandle ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>
                {activeCandle.low.toFixed(coin.decimals)}
              </span>
            </span>
            <span className="text-gray-400">
              C:{' '}
              <span className={isUpCandle ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>
                {activeCandle.close.toFixed(coin.decimals)}
              </span>
            </span>
            <span className="text-gray-500">V: {activeCandle.volume.toLocaleString()}</span>
          </>
        )}
      </div>

      {/* Main Container Workspace */}
      <div ref={containerRef} className="flex-1 w-full bg-[#161a1e] overflow-hidden min-h-[220px] relative">
        {chartMode === 'lightweight' ? (
          /* TV lightweight-charts Canvas Container */
          <div
            id="lightweight-tvchart-container"
            ref={lightweightContainerRef}
            className="w-full h-full"
          />
        ) : (
          /* CUSTOM SVG VECTOR CHART WORKSPACE */
          <svg
            id="tradingchart-svg"
            width={dimensions.width}
            height={dimensions.height}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="cursor-crosshair block overflow-visible"
          >
            {/* Background Grid Lines */}
            {yTicks.map((tick, i) => (
              <line
                key={`grid-y-${i}`}
                x1={paddingX}
                y1={getY(tick)}
                x2={dimensions.width - 10}
                y2={getY(tick)}
                stroke="#22262d"
                strokeWidth={0.7}
                strokeDasharray="2,3"
              />
            ))}

            {/* Time axis marks / X Axis Lines */}
            {visibleCandles.map((c, i) => {
              if (i % Math.round(zoomLevel / 5) === 0) {
                const xPos = getX(i);
                return (
                  <g key={`time-axis-${i}`}>
                    <line
                      x1={xPos}
                      y1={15}
                      x2={xPos}
                      y2={mainChartHeight + 10}
                      stroke="#1e2229"
                      strokeWidth={0.8}
                    />
                    <text
                      x={xPos}
                      y={mainChartHeight + 22}
                      fill="#5e6673"
                      fontSize="9px"
                      textAnchor="middle"
                    >
                      {c.time}
                    </text>
                  </g>
                );
              }
              return null;
            })}

            {/* Price label Ticks (Y-Axis) */}
            {yTicks.map((tick, i) => (
              <text
                key={`tick-price-${i}`}
                x={paddingX - 8}
                y={getY(tick) + 4}
                fontSize="9px"
                fill="#5e6673"
                fontFamily="monospace"
                textAnchor="end"
              >
                {tick.toFixed(coin.decimals)}
              </text>
            ))}

            {/* Volume bars inside Main Chart */}
            {visibleCandles.map((c, i) => {
              const x = getX(i);
              const vHeight = getVolHeight(c.volume);
              const isBullish = c.close >= c.open;
              const barWidth = Math.max(2, (chartWidth / zoomLevel) * 0.7);

              return (
                <rect
                  key={`vol-bar-${i}`}
                  x={x - barWidth / 2}
                  y={mainChartHeight - vHeight + 15}
                  width={barWidth}
                  height={vHeight}
                  fill={isBullish ? 'rgba(14, 203, 129, 0.15)' : 'rgba(246, 70, 93, 0.15)'}
                />
              );
            })}

            {/* Candlesticks (Wicks + Bodies) */}
            {visibleCandles.map((c, i) => {
              const x = getX(i);
              const yOpen = getY(c.open);
              const yClose = getY(c.close);
              const yHigh = getY(c.high);
              const yLow = getY(c.low);

              const isBullish = c.close >= c.open;
              const candleWidth = Math.max(3, (chartWidth / zoomLevel) * 0.65);
              const color = isBullish ? '#0ecb81' : '#f6465d';

              return (
                <g key={`candle-${i}`}>
                  {/* Wick line */}
                  <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth={1.2} />
                  {/* Solid Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={Math.min(yOpen, yClose)}
                    width={candleWidth}
                    height={Math.max(1, Math.abs(yOpen - yClose))}
                    fill={color}
                    stroke={color}
                    strokeWidth={0.5}
                  />
                </g>
              );
            })}

            {/* Moving average overlays */}
            {showMa && (
              <>
                {/* MA 7 (Yellow) */}
                <path d={ma7Path} fill="none" stroke="#f0b90b" strokeWidth={1.3} strokeLinecap="round" />
                {/* MA 25 (Pink / Violet) */}
                <path d={ma25Path} fill="none" stroke="#e02f97" strokeWidth={1.3} strokeLinecap="round" />
              </>
            )}

            {/* RSI Indicator Section */}
            {showRsi && (
              <g id="rsi-indicator-group">
                {/* RSI Border & Background Grid Lines */}
                <rect
                  x={paddingX}
                  y={mainChartHeight + 35}
                  width={chartWidth}
                  height={bottomChartHeight}
                  fill="none"
                  stroke="#2b3139"
                  strokeWidth={0.8}
                />
                {/* RSI oversold/overbought guidelines (30 and 70) */}
                <line
                  x1={paddingX}
                  y1={getRsiY(70)}
                  x2={dimensions.width - 10}
                  y2={getRsiY(70)}
                  stroke="#5e6673"
                  strokeWidth={0.7}
                  strokeDasharray="4,4"
                  opacity={0.5}
                />
                <line
                  x1={paddingX}
                  y1={getRsiY(30)}
                  x2={dimensions.width - 10}
                  y2={getRsiY(30)}
                  stroke="#5e6673"
                  strokeWidth={0.7}
                  strokeDasharray="4,4"
                  opacity={0.5}
                />
                <text x={paddingX - 8} y={getRsiY(70) + 3} fontSize="8px" fill="#5e6673" textAnchor="end">
                  70
                </text>
                <text x={paddingX - 8} y={getRsiY(30) + 3} fontSize="8px" fill="#5e6673" textAnchor="end">
                  30
                </text>
                <text x={paddingX + 10} y={mainChartHeight + 48} fontSize="9px" fill="#0ecb81" fontWeight="bold">
                  RSI (14):{' '}
                  {rsiValues[activeCandleIndex] ? rsiValues[activeCandleIndex].toFixed(1) : '50.0'}
                </text>

                {/* RSI Chart Line */}
                {(() => {
                  let rsiPath = '';
                  rsiValues.forEach((val, idx) => {
                    const x = getX(idx);
                    const y = getRsiY(val || 50);
                    rsiPath += (rsiPath === '' ? 'M' : 'L') + `${x},${y}`;
                  });
                  return <path d={rsiPath} fill="none" stroke="#2563eb" strokeWidth={1.2} />;
                })()}
              </g>
            )}

            {/* Interactive Crosshair Mouse Hover Lines */}
            {hoverIndex !== null && (
              <g id="crosshair-indicator-lines">
                {/* Tech Line Y */}
                <line
                  x1={getX(hoverIndex)}
                  y1={15}
                  x2={getX(hoverIndex)}
                  y2={dimensions.height - 20}
                  stroke="#848e9c"
                  strokeWidth={0.8}
                  strokeDasharray="3,3"
                  opacity={0.7}
                />
                {/* Tech Line X */}
                {mousePos.y <= mainChartHeight + 20 && (
                  <line
                    x1={paddingX}
                    y1={mousePos.y}
                    x2={dimensions.width - 10}
                    y2={mousePos.y}
                    stroke="#848e9c"
                    strokeWidth={0.8}
                    strokeDasharray="3,3"
                    opacity={0.7}
                  />
                )}

                {/* Hover coordinates label display */}
                <circle cx={getX(hoverIndex)} cy={getY(activeCandle.close)} r={3.5} fill="#f0b90b" />
              </g>
            )}
          </svg>
        )}
      </div>

      {/* Mini Legend footer overlay */}
      <div className="px-4 py-1.5 flex gap-4 text-[9px] sm:text-[10px] text-gray-500 border-t border-[#2b3139] bg-[#14181c] font-mono">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-0.5 bg-[#f0b90b] inline-block" /> MA(7)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-0.5 bg-[#e02f97] inline-block" /> MA(25)
        </span>
        <span className="ml-auto text-gray-400">
          Engine: {chartMode === 'lightweight' ? 'Interactive H5 Canvas' : 'Vector SVG Engine'} • Interval: 15m
        </span>
      </div>
    </div>
  );
};
