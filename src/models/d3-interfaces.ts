import * as d3 from 'd3'

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
}

export class CustomForceGraph {
  static d3DragDefaults<T>(sim: d3.Simulation<d3Node<T>, undefined>) {
    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(this: SVGCircleElement, event: d3.D3DragEvent<SVGCircleElement, d3Node<T>, d3Node<T>>, d: d3Node<T>) {
      if (!event.active) sim.alphaTarget(0.5).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
  
    // Update the subject (dragged node) position during drag.
    function dragged(this: SVGCircleElement, event: d3.D3DragEvent<SVGCircleElement, d3Node<T>, d3Node<T>>, d: d3Node<T>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
  
    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it’s no longer being dragged.
    function dragended(this: SVGCircleElement, event: d3.D3DragEvent<SVGCircleElement, d3Node<T>, d3Node<T>>, d: d3Node<T>) {
      if (!event.active) sim.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return d3.drag<SVGCircleElement, d3Node<T>>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended) as any
  }

  static d3PanningAndNodeDrag<T>(sim: d3.Simulation<d3Node<T>, undefined>) {
    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(this: SVGCircleElement, event: d3.D3DragEvent<SVGCircleElement, d3Node<T>, d3Node<T>>, d: d3Node<T>) {
      if (!event.active) sim.alphaTarget(0.5).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
  
    // Update the subject (dragged node) position during drag.
    function dragged(this: SVGCircleElement, event: d3.D3DragEvent<SVGCircleElement, d3Node<T>, d3Node<T>>, d: d3Node<T>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
  
    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it’s no longer being dragged.
    function dragended(this: SVGCircleElement, event: d3.D3DragEvent<SVGCircleElement, d3Node<T>, d3Node<T>>, d: d3Node<T>) {
      if (!event.active) sim.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return d3.drag<SVGCircleElement, d3Node<T>>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended) as any
  }

  static d3PanAndGeometricZoom(s: d3.Selection<any, any, any, any>) {
    const handleZoom = (event: { transform: any }) => {
      // todo: add 'semantic' zoom for text labels so they stay the same size no matter the zoom level.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      s.attr('transform', event.transform)
    }
    const zoom = d3.zoom()
      //.scaleExtent([0.1,10])
      .on('zoom', handleZoom)
    return zoom as any
  }


}
