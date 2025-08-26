'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { motion } from 'framer-motion'

interface BiasMetric {
  axis: string
  value: number
  description: string
  color: string
}

interface BiasRadarChartProps {
  data?: BiasMetric[]
  size?: number
  className?: string
  animated?: boolean
}

const defaultData: BiasMetric[] = [
  { axis: 'Consistency', value: 85, description: 'Ruling uniformity', color: '#4a9eff' },
  { axis: 'Speed', value: 72, description: 'Case resolution time', color: '#10b981' },
  { axis: 'Settlement', value: 68, description: 'Settlement preference', color: '#a855f7' },
  { axis: 'Risk Tolerance', value: 45, description: 'Legal innovation', color: '#f97316' },
  { axis: 'Predictability', value: 78, description: 'Outcome reliability', color: '#ec4899' }
]

export function BiasRadarChart({ 
  data = defaultData, 
  size = 400, 
  className = '',
  animated = true 
}: BiasRadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!svgRef.current) return

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove()

    const width = size
    const height = size
    const margin = 60
    const radius = Math.min(width, height) / 2 - margin

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`)

    // Scales
    const angleScale = d3.scalePoint()
      .domain(data.map(d => d.axis))
      .range([0, 2 * Math.PI])

    const radiusScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, radius])

    // Grid levels
    const levels = 5
    const levelStep = 100 / levels

    // Draw grid circles
    for (let level = 1; level <= levels; level++) {
      const levelRadius = radiusScale(level * levelStep)
      
      g.append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', levelRadius)
        .style('fill', 'none')
        .style('stroke', '#e5e7eb')
        .style('stroke-width', 1)
        .style('stroke-dasharray', '2,2')
        .style('opacity', 0)
        .transition()
        .duration(animated ? 500 : 0)
        .delay(animated ? level * 100 : 0)
        .style('opacity', 0.3)

      // Level labels
      if (level % 2 === 0) {
        g.append('text')
          .attr('x', 5)
          .attr('y', -levelRadius)
          .text(`${level * levelStep}%`)
          .style('font-size', '10px')
          .style('fill', '#6b7280')
          .style('opacity', 0)
          .transition()
          .duration(animated ? 500 : 0)
          .delay(animated ? level * 100 : 0)
          .style('opacity', 0.7)
      }
    }

    // Draw axes
    data.forEach((d, i) => {
      const angle = angleScale(d.axis) || 0
      const lineCoordinate = angleToCoordinate(angle, radius, 0, 0)
      
      // Axis lines
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', lineCoordinate.x)
        .attr('y2', lineCoordinate.y)
        .style('stroke', '#e5e7eb')
        .style('stroke-width', 1)
        .style('opacity', 0)
        .transition()
        .duration(animated ? 500 : 0)
        .delay(animated ? i * 50 : 0)
        .style('opacity', 0.5)

      // Axis labels
      const labelCoordinate = angleToCoordinate(angle, radius + 30, 0, 0)
      
      const label = g.append('text')
        .attr('x', labelCoordinate.x)
        .attr('y', labelCoordinate.y)
        .text(d.axis)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('fill', hoveredAxis === d.axis ? d.color : '#374151')
        .style('cursor', 'pointer')
        .style('opacity', 0)
        .transition()
        .duration(animated ? 500 : 0)
        .delay(animated ? i * 50 : 0)
        .style('opacity', 1)

      // Add interactivity to labels
      g.append('text')
        .attr('x', labelCoordinate.x)
        .attr('y', labelCoordinate.y)
        .text(d.axis)
        .style('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('fill', 'transparent')
        .style('cursor', 'pointer')
        .on('mouseenter', () => setHoveredAxis(d.axis))
        .on('mouseleave', () => setHoveredAxis(null))

      // Value labels
      const valueCoordinate = angleToCoordinate(angle, radiusScale(d.value), 0, 0)
      g.append('text')
        .attr('x', valueCoordinate.x)
        .attr('y', valueCoordinate.y - 5)
        .text(`${d.value}%`)
        .style('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .style('fill', d.color)
        .style('opacity', 0)
        .transition()
        .duration(animated ? 500 : 0)
        .delay(animated ? 800 + i * 50 : 0)
        .style('opacity', hoveredAxis === d.axis ? 1 : 0)
    })

    // Prepare data for the radar area
    const radarLine = d3.lineRadial<BiasMetric>()
      .angle((d) => angleScale(d.axis) || 0)
      .radius((d) => radiusScale(d.value))
      .curve(d3.curveLinearClosed)

    // Draw the radar area
    const radarArea = g.append('path')
      .datum(data)
      .attr('d', radarLine as any)
      .style('fill', 'url(#gradient)')
      .style('fill-opacity', 0.3)
      .style('stroke', '#4a9eff')
      .style('stroke-width', 2)

    if (animated) {
      // Animate the radar area
      const totalLength = (radarArea.node() as SVGPathElement)?.getTotalLength() || 0
      radarArea
        .style('stroke-dasharray', totalLength)
        .style('stroke-dashoffset', totalLength)
        .transition()
        .duration(1500)
        .ease(d3.easeCubicInOut)
        .style('stroke-dashoffset', 0)
    }

    // Add gradient
    const gradient = svg.append('defs')
      .append('radialGradient')
      .attr('id', 'gradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%')

    gradient.append('stop')
      .attr('offset', '0%')
      .style('stop-color', '#4a9eff')
      .style('stop-opacity', 0.8)

    gradient.append('stop')
      .attr('offset', '100%')
      .style('stop-color', '#ec4899')
      .style('stop-opacity', 0.2)

    // Draw data points
    data.forEach((d, i) => {
      const angle = angleScale(d.axis) || 0
      const coordinate = angleToCoordinate(angle, radiusScale(d.value), 0, 0)
      
      const circle = g.append('circle')
        .attr('cx', coordinate.x)
        .attr('cy', coordinate.y)
        .attr('r', 0)
        .style('fill', d.color)
        .style('stroke', '#fff')
        .style('stroke-width', 2)
        .style('cursor', 'pointer')

      if (animated) {
        circle.transition()
          .duration(500)
          .delay(1000 + i * 100)
          .attr('r', 6)
      } else {
        circle.attr('r', 6)
      }

      // Add hover effect
      circle
        .on('mouseenter', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 8)
          setHoveredAxis(d.axis)
        })
        .on('mouseleave', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 6)
          setHoveredAxis(null)
        })

      // Tooltip
      circle.append('title')
        .text(`${d.axis}: ${d.value}% - ${d.description}`)
    })

    setIsVisible(true)

  }, [data, size, animated, hoveredAxis])

  // Helper function to convert angle to coordinates
  function angleToCoordinate(angle: number, radius: number, cx: number, cy: number) {
    return {
      x: cx + radius * Math.cos(angle - Math.PI / 2),
      y: cy + radius * Math.sin(angle - Math.PI / 2)
    }
  }

  return (
    <motion.div 
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.9 }}
      transition={{ duration: 0.5 }}
    >
      <svg ref={svgRef} className="w-full h-full" />
      
      {/* Legend */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 text-xs">
        {data.map((d) => (
          <div 
            key={d.axis}
            className={`flex items-center gap-1 cursor-pointer transition-opacity ${
              hoveredAxis && hoveredAxis !== d.axis ? 'opacity-50' : ''
            }`}
            onMouseEnter={() => setHoveredAxis(d.axis)}
            onMouseLeave={() => setHoveredAxis(null)}
          >
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-muted-foreground">{d.axis}</span>
          </div>
        ))}
      </div>

      {/* Hover details */}
      {hoveredAxis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute top-4 right-4 bg-card border border-border rounded-lg p-3 shadow-lg max-w-[200px]"
        >
          <h4 className="font-semibold text-sm mb-1">{hoveredAxis}</h4>
          <p className="text-xs text-muted-foreground">
            {data.find(d => d.axis === hoveredAxis)?.description}
          </p>
          <p className="text-lg font-bold mt-1" style={{ 
            color: data.find(d => d.axis === hoveredAxis)?.color 
          }}>
            {data.find(d => d.axis === hoveredAxis)?.value}%
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}