import * as d3 from 'd3'
import { type GraphNode } from 'src/composables/use-task-graph-data'

export interface d3Node<T> extends d3.SimulationNodeDatum {
  id: number
  obj: T
  index: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  repel: number
  // Metadata for rendering
  isStarred?: boolean
  isSearchResult?: boolean
  isCenterTask?: boolean
}

export class CustomForceGraph {
  static d3DragDefaults(sim: d3.Simulation<GraphNode, undefined>, container?: d3.Selection<any, any, any, any>) {
    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(
      this: SVGCircleElement,
      event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>,
      d: GraphNode
    ) {
      if (!event.active) sim.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }

    // Update the subject (dragged node) position during drag.
    function dragged(
      this: SVGCircleElement,
      event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>,
      d: GraphNode
    ) {
      // Use d3.pointer with container to get coordinates in transformed space
      if (container) {
        const [x, y] = d3.pointer(event, container.node())
        event.subject.fx = x
        event.subject.fy = y
      } else {
        event.subject.fx = event.x
        event.subject.fy = event.y
      }
    }

    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it's no longer being dragged.
    function dragended(
      this: SVGCircleElement,
      event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>,
      d: GraphNode
    ) {
      if (!event.active) sim.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }

    return d3
      .drag<SVGCircleElement, GraphNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended) as any
  }

  static d3PanningAndNodeDrag<T>(sim: d3.Simulation<GraphNode, undefined>) {
    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(
      this: SVGCircleElement,
      event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>,
      d: GraphNode
    ) {
      if (!event.active) sim.alphaTarget(0.5).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }

    // Update the subject (dragged node) position during drag.
    function dragged(
      this: SVGCircleElement,
      event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>,
      d: GraphNode
    ) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }

    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it’s no longer being dragged.
    function dragended(
      this: SVGCircleElement,
      event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>,
      d: GraphNode
    ) {
      if (!event.active) sim.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }

    return d3
      .drag<SVGCircleElement, GraphNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended) as any
  }

  static d3PanAndGeometricZoom(s: d3.Selection<any, any, any, any>) {
    const handleZoom = (event: { transform: any }) => {
      // todo: add 'semantic' zoom for text labels so they stay the same size no matter the zoom level.
      
      s.attr('transform', event.transform)
    }
    const zoom = d3
      .zoom()
      //.scaleExtent([0.1,10])
      .on('zoom', handleZoom)
    return zoom as any
  }
}
