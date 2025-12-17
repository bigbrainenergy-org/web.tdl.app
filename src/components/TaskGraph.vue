<template>
  <div ref="containerRef" class="task-graph-container">
    <svg ref="svgRef" />
  </div>
</template>

<script setup lang="ts">
  import * as d3 from 'd3'
  import { onMounted, onUnmounted, ref, watch } from 'vue'
  import { useElementSize } from '@vueuse/core'
  import { CustomForceGraph } from 'src/models/d3-interfaces'
  import type { Task } from 'src/stores/tasks/task-model'
  import type { GraphNode, GraphLink } from 'src/composables/use-task-graph-data'

  interface Props {
    nodes: GraphNode[]
    links: GraphLink[]
  }

  const props = defineProps<Props>()

  const emit = defineEmits<{
    nodeClick: [task: Task]
    nodeContextMenu: [task: Task, event: MouseEvent]
  }>()

  const containerRef = ref<HTMLDivElement | null>(null)
  const svgRef = ref<SVGSVGElement | null>(null)
  const { width, height } = useElementSize(containerRef)

  let simulation: d3.Simulation<GraphNode, undefined> | null = null
  let svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined> | null = null
  let gg: any = null
  let gnodes: any = null
  let node: any = null
  let link: any = null
  let label: any = null

  // Animation constants
  const FADE_DURATION = 200 // ms

  // Local copies of data for D3 mutation
  let localNodes: GraphNode[] = []
  let localLinks: GraphLink[] = []

  const updateSlopes = () => {
    localLinks.forEach((d) => {
      d.slopeY = (d.target).y - (d.source).y
      d.slopeX = (d.target).x - (d.source).x
      d.angle = Math.atan(d.slopeY / d.slopeX)
      d.normalXoffset = Math.cos(d.angle)
      d.normalYoffset = Math.sin(d.angle)
    })
  }

  const ticked = () => {
    if (!gnodes || !link || !label) return

    // Position parent g elements via transform (works for both circles and paths)
    gnodes.attr('transform', (d: GraphNode) => `translate(${d.x},${d.y})`)
    updateSlopes()

    link
      .attr('x1', (d: GraphLink) =>
        (d.source).x +
        (d.source).radius * d.normalXoffset * (d.slopeX < 0 ? -1 : 1)
      )
      .attr('y1', (d: GraphLink) =>
        (d.source).y +
        (d.source).radius * d.normalYoffset * (d.slopeX < 0 ? -1 : 1)
      )
      .attr('x2', (d: GraphLink) =>
        (d.target).x +
        (d.target).radius * d.normalXoffset * (d.slopeX > 0 ? -1 : 1)
      )
      .attr('y2', (d: GraphLink) =>
        (d.target).y +
        (d.target).radius * d.normalYoffset * (d.slopeX > 0 ? -1 : 1)
      )

    // Labels are children of gnodes, position relative to origin
    label.attr('x', 0).attr('y', (d: GraphNode) => -d.radius - 5)
  }

  function raise(this: any) {
    d3.select(this.parentNode).raise()
  }

  const initializeGraph = () => {
    const w = width.value || 800
    const h = height.value || 600

    // Copy data for D3 mutation
    localNodes = [...props.nodes]
    localLinks = [...props.links]

    simulation = d3
      .forceSimulation(localNodes)
      .alphaDecay(0.1)
      .velocityDecay(0.6)
      .force('charge', d3.forceManyBody().strength(-200))
      .force('link', d3.forceLink(localLinks).distance(100))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.radius + 8))
      .force('x', d3.forceX(w / 2).strength(0.05))
      .force('y', d3.forceY(h / 2).strength(0.05))
      .on('tick', ticked)

    svg = d3
      .select(svgRef.value)
      .attr('width', w)
      .attr('height', h)
      .attr('viewBox', [0, 0, w, h])

    gg = svg.append('g').attr('cursor', 'grab')

    // Arrow marker
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'task-graph-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#AAA')

    link = gg
      .selectAll('line')
      .data(localLinks)
      .join('line')
      .attr('stroke', '#FFF')
      .attr('stroke-opacity', '0.5')
      .attr('marker-end', 'url(#task-graph-arrow)')

    gnodes = gg.selectAll('gnode').data(localNodes).enter().append('g').classed('gnode', true)

    // Create star symbol generator
    const starSymbol = d3.symbol().type(d3.symbolStar)
    const truncate = (s: string, max: number) => s.length > max ? s.slice(0, max - 1) + '…' : s

    // Append circles for non-starred tasks
    gnodes
      .filter((d: GraphNode) => !d.isStarred)
      .append('circle')
      .attr('r', (d: GraphNode) => d.radius)
      .attr('fill', (d: GraphNode) => d.color)
      .attr('stroke', (d: GraphNode) => {
        if (d.isSearchResult) return '#A855F7'
        if (d.isCenterTask) return '#FFD700'
        return 'none'
      })
      .attr('stroke-width', 3)
      .on('mouseover', raise)

    // Append stars for starred tasks
    gnodes
      .filter((d: GraphNode) => d.isStarred)
      .append('path')
      .attr('d', (d: GraphNode) => starSymbol.size(d.radius * d.radius * 3)())
      .attr('fill', (d: GraphNode) => d.color)
      .attr('stroke', (d: GraphNode) => {
        if (d.isSearchResult) return '#A855F7'
        if (d.obj.completed) return '#888'
        return '#FFD700'
      })
      .attr('stroke-width', 2)
      .on('mouseover', raise)

    // Select all node shapes (circles and paths) for drag/click handlers
    node = gnodes.select('circle, path')

    // Add labels - always show for search results and center task
    label = gnodes
      .filter((d: GraphNode) => d.isSearchResult || d.isCenterTask || !d.obj.completed || d.radius >= 12)
      .append('text')
      .text((d: GraphNode) => truncate(((d as any).obj.title as string), 30))
      .style('font', (d: GraphNode) => (d.isSearchResult || d.isCenterTask) ? '1em sans-serif' : '0.8em sans-serif')
      .attr('text-anchor', 'middle')
      .attr('stroke', 'black')
      .attr('stroke-width', '0.15em')
      .attr('fill', (d: GraphNode) => {
        if (d.isSearchResult) return '#A855F7'
        if (d.isCenterTask) return '#FFD700'
        return '#CCC'
      })
      .attr('paint-order', 'stroke')
      .attr('x', 0)
      .attr('y', (d: GraphNode) => -d.radius - 5)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    svg.call(CustomForceGraph.d3PanAndGeometricZoom(gg))
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    node.call(CustomForceGraph.d3DragDefaults(simulation, gg))

    node.on('click', (event: MouseEvent) => {
      const task = (event.target as any).__data__.obj as Task
      emit('nodeClick', task)
    })

    node.on('contextmenu', (event: MouseEvent) => {
      event.preventDefault()
      const task = (event.target as any).__data__.obj as Task
      emit('nodeContextMenu', task, event)
    })
  }

  const updateGraph = () => {
    if (!simulation || !gg) return

    // Store old positions by task id
    const oldPositions = new Map<number, { x: number; y: number }>()
    localNodes.forEach(n => {
      oldPositions.set(n.obj.id, { x: n.x, y: n.y })
    })

    // Copy new data
    localNodes = [...props.nodes]
    localLinks = [...props.links]

    // Restore positions for existing nodes, place new nodes near center
    const w = width.value || 800
    const h = height.value || 600
    localNodes.forEach(n => {
      const old = oldPositions.get(n.obj.id)
      if (old) {
        n.x = old.x
        n.y = old.y
      } else {
        n.x = w / 2 + (Math.random() - 0.5) * 50
        n.y = h / 2 + (Math.random() - 0.5) * 50
      }
    })

    // Update links with join
    link = gg
      .selectAll('line')
      .data(localLinks)
      .join(
        (enter: any) => enter.append('line')
          .attr('stroke', '#FFF')
          .attr('stroke-opacity', 0.5)
          .attr('marker-end', 'url(#task-graph-arrow)')
          .style('opacity', 0)
          .call((e: any) => e.transition().duration(FADE_DURATION).style('opacity', 1)),
        (update: any) => update,
        (exit: any) => exit.transition().duration(FADE_DURATION).style('opacity', 0).remove()
      )

    // Update gnodes with join
    const starSymbol = d3.symbol().type(d3.symbolStar)
    const truncate = (s: string, max: number) => s.length > max ? s.slice(0, max - 1) + '…' : s

    gnodes = gg
      .selectAll('.gnode')
      .data(localNodes, (d: any) => d.obj.id)
      .join(
        (enter: any) => {
          const g = enter.append('g')
            .classed('gnode', true)
            .attr('transform', (d: GraphNode) => `translate(${d.x},${d.y})`)
            .style('opacity', 0)

          // Add circles for non-starred tasks
          g.filter((d: GraphNode) => !d.isStarred)
            .append('circle')
            .attr('r', (d: GraphNode) => d.radius)
            .attr('fill', (d: GraphNode) => d.color)
            .attr('stroke', (d: GraphNode) => {
              if (d.isSearchResult) return '#A855F7'
              if (d.isCenterTask) return '#FFD700'
              return 'none'
            })
            .attr('stroke-width', 3)
            .on('mouseover', raise)

          // Add stars for starred tasks
          g.filter((d: GraphNode) => d.isStarred)
            .append('path')
            .attr('d', (d: GraphNode) => starSymbol.size(d.radius * d.radius * 3)())
            .attr('fill', (d: GraphNode) => d.color)
            .attr('stroke', (d: GraphNode) => {
              if (d.isSearchResult) return '#A855F7'
              if (d.obj.completed) return '#888'
              return '#FFD700'
            })
            .attr('stroke-width', 2)
            .on('mouseover', raise)

          // Add labels - always show for search results and center task
          g.filter((d: GraphNode) => d.isSearchResult || d.isCenterTask || !d.obj.completed || d.radius >= 12)
            .append('text')
            .text((d: GraphNode) => truncate(d.obj.title, 30))
            .style('font', (d: GraphNode) => (d.isSearchResult || d.isCenterTask) ? '1em sans-serif' : '0.8em sans-serif')
            .attr('text-anchor', 'middle')
            .attr('stroke', 'black')
            .attr('stroke-width', '0.15em')
            .attr('fill', (d: GraphNode) => {
              if (d.isSearchResult) return '#A855F7'
              if (d.isCenterTask) return '#FFD700'
              return '#CCC'
            })
            .attr('paint-order', 'stroke')
            .attr('x', 0)
            .attr('y', (d: GraphNode) => -d.radius - 5)

          g.transition().duration(FADE_DURATION).style('opacity', 1)
          return g
        },
        (update: any) => {
          // Update stroke colors for highlighting changes (center task, search results)
          update.select('circle')
            .attr('stroke', (d: GraphNode) => {
              if (d.isSearchResult) return '#A855F7'
              if (d.isCenterTask) return '#FFD700'
              return 'none'
            })
          update.select('path')
            .attr('stroke', (d: GraphNode) => {
              if (d.isSearchResult) return '#A855F7'
              if (d.obj.completed) return '#888'
              if (d.isCenterTask) return '#FFD700'
              return '#FFD700'
            })
          // Update label colors
          update.select('text')
            .attr('fill', (d: GraphNode) => {
              if (d.isSearchResult) return '#A855F7'
              if (d.isCenterTask) return '#FFD700'
              return '#CCC'
            })
          return update
        },
        (exit: any) => exit.transition().duration(FADE_DURATION).style('opacity', 0).remove()
      )

    // Update node selection and handlers
    node = gnodes.select('circle, path')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    node.call(CustomForceGraph.d3DragDefaults(simulation, gg))
    node.on('click', (event: MouseEvent) => {
      const task = (event.target as any).__data__.obj as Task
      emit('nodeClick', task)
    })
    node.on('contextmenu', (event: MouseEvent) => {
      event.preventDefault()
      const task = (event.target as any).__data__.obj as Task
      emit('nodeContextMenu', task, event)
    })

    label = gnodes.select('text')

    // Update simulation
    simulation.nodes(localNodes)
    simulation.force('link', d3.forceLink(localLinks).distance(100))
    simulation.alpha(0.3).restart()
  }

  const reInitialize = () => {
    if (simulation) simulation.stop()
    if (svg) {
      svg.selectAll('line').remove()
      svg.selectAll('.gnode').remove()
      svg.selectAll('defs').remove()
    }
    initializeGraph()
  }

  // Watch for size changes
  watch([width, height], ([w, h]) => {
    if (w > 0 && h > 0 && svg) {
      svg.attr('width', w).attr('height', h).attr('viewBox', [0, 0, w, h])
      if (simulation) {
        simulation.force('center', d3.forceCenter(w / 2, h / 2))
        simulation.force('x', d3.forceX(w / 2).strength(0.05))
        simulation.force('y', d3.forceY(h / 2).strength(0.05))
      }
    }
  })

  // Watch for data changes - use smooth update
  watch([() => props.nodes, () => props.links], () => {
    if (simulation && gg) {
      updateGraph()
    }
  }, { deep: true })

  // Initialize when container has valid dimensions
  let initialized = false
  watch([width, height], ([w, h]) => {
    if (w > 0 && h > 0 && !initialized) {
      initialized = true
      initializeGraph()
    }
  }, { immediate: true })

  onMounted(() => {
    if (width.value > 0 && height.value > 0 && !initialized) {
      initialized = true
      initializeGraph()
    }
  })

  onUnmounted(() => {
    if (simulation) simulation.stop()
  })

  // Expose methods for parent components
  defineExpose({
    updateGraph,
    reInitialize
  })
</script>

<style scoped>
  .task-graph-container {
    width: 100%;
    height: 100%;
  }

  .task-graph-container svg {
    display: block;
    width: 100%;
    height: 100%;
    background-color: #1a1a1a;
  }
</style>

<style>
  .task-graph-container svg text {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
</style>
