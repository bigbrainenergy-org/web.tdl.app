<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="full-height">
        <q-card class="full-height q-pl-md text-primary" style="background-color: #1d1d1df6">
          <svg ref="graphRef" id="graphElement"></svg>  
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style>
svg text{
   -webkit-user-select: none;
   -moz-user-select: none;
   -ms-user-select: none;
   user-select: none;
}
</style>

<script setup lang="ts">
import { useRepo } from 'pinia-orm'
import { Task, TaskRepo } from 'src/stores/tasks/task'
import * as d3 from 'd3'
import { onMounted, ref } from 'vue'
import { CustomForceGraph, d3Node } from 'src/models/d3-interfaces'
import { useQuasar } from 'quasar'
import UpdateTaskDialog from 'src/components/UpdateTaskDialog.vue'

const tr = useRepo(TaskRepo)
let allTasks
let allTaskNodes: d3Node<Task>[]

// size of the chart, not size of the viewport onto the chart
let width = 1000
let height = 1000

type d3Link<T> = d3.SimulationLinkDatum<d3Node<T>> & { slopeX: number, slopeY: number, angle: number, normalXoffset: number, normalYoffset: number }
let links: d3Link<Task>[]

const populateGraphDataStructures = () => {
  allTasks = tr.all()
  allTaskNodes = []
  links = []
  for(let i = 0; i < allTasks.length; i++) {
    allTaskNodes.push(allTasks[i].d3forceNode(i))
  }
  const taskNodeMap: Map<number, d3Node<Task>> = new Map<number, d3Node<Task>>()
  allTaskNodes.forEach((x) => taskNodeMap.set(x.id, x))
  links = links.concat(...allTaskNodes.map((x: d3Node<Task>) => 
    x.obj.hard_postreq_ids.map((y: number) => ({ 
      source: x, target: taskNodeMap.get(y), slopeX: 1, slopeY: 1, normalXoffset: 1, normalYoffset: 1
    } as d3Link<Task>))
  ))
}

populateGraphDataStructures()

console.debug({links})

const graphRef = ref<SVGSVGElement | null>(null)

let link: d3.Selection<SVGLineElement, d3Link<Task>, SVGSVGElement | null, unknown>
let node: d3.Selection<SVGCircleElement, d3Node<Task>, SVGSVGElement | null, unknown>
let label: d3.Selection<SVGTextElement, d3Node<Task>, SVGSVGElement | null, unknown>

const updateSlopes = () => {
  links.forEach((d) => {
    d.slopeY = (d.target as d3Node<Task>).y - (d.source as d3Node<Task>).y
    d.slopeX = (d.target as d3Node<Task>).x - (d.source as d3Node<Task>).x
    d.angle = Math.atan(d.slopeY/d.slopeX)
    d.normalXoffset = Math.cos(d.angle)
    d.normalYoffset = Math.sin(d.angle)
  })
}

const ticked = () => {
  node
    .attr('cx', d => d.x)
    .attr('cy', d => d.y)

  updateSlopes()

  link
    .attr('x1', d => (d.source as d3Node<Task>).x + ((d.source as d3Node<Task>).radius * d.normalXoffset * (d.slopeX < 0 ? -1 : 1)))
    .attr('y1', d => (d.source as d3Node<Task>).y + ((d.source as d3Node<Task>).radius * d.normalYoffset * (d.slopeX < 0 ? -1 : 1)))
    .attr('x2', d => (d.target as d3Node<Task>).x + ((d.target as d3Node<Task>).radius * d.normalXoffset * (d.slopeX > 0 ? -1 : 1)))
    .attr('y2', d => (d.target as d3Node<Task>).y + ((d.target as d3Node<Task>).radius * d.normalYoffset * (d.slopeX > 0 ? -1 : 1)))

  label
    .attr('x', d => d.x)
    .attr('y', d => d.y-10)
}

let simulation: d3.Simulation<d3Node<Task>, undefined>

const $q = useQuasar()

let gnodes: any
let gg: any

let svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>

const initializeGraph = () => {
  // updateSize()
  console.debug({width, height})
  simulation = d3.forceSimulation(allTaskNodes)
    .force('charge', d3.forceManyBody().strength(-128))
    .force('link', d3.forceLink(links))
    .force('center', d3.forceCenter(width/2, height/2))
    .force('collision', d3.forceCollide().radius((d: any) => d.radius + 4))
    .force('x', d3.forceX().strength(0.08))
    .force('y', d3.forceY().strength(0.08))
    .on('tick', ticked)
  svg = d3.select(graphRef.value)
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('style', 'max-width: 100%; height: auto;')

  gg = svg.append('g').attr('cursor', 'grab')

  gnodes = gg.selectAll('gnode')
    .data(allTaskNodes)
    .enter()
    .append('g')
    .classed('gnode', true)

  svg.append('defs')
    .append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 8)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#AAA')

  link = gg.selectAll('line')
      .data(links)
      .join('line')
      //.attr('stroke-width', (d: d3Link<Task>) => (d.source as d3Node<Task>).obj.hard_postreq_ids.length**2)
      .attr('stroke', '#FFF')
      .attr('stroke-opacity', '0.3')
      .attr('marker-end', 'url(#arrowhead)')
  
  node = gnodes
    .append('circle')
    .attr('r', (d: d3Node<Task>) => d.radius)
    .attr('fill', (d: d3Node<Task>) => d.color)
  
  label = gnodes.filter((x: d3Node<Task>) => x.radius >= 12 || x.obj.hard_prereq_ids.length == 0)
    .append('text')
    .text((d: d3Node<Task>) => d.obj.title)
    .attr('stroke', 'black')
    .attr('stroke-width', '0.3em')
    .attr('class', 'text-primary')
    .attr('fill', '#DDD')
    .attr('paint-order', 'stroke')
  
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument  
  svg.call(CustomForceGraph.d3PanAndGeometricZoom(gg))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  node.call(CustomForceGraph.d3DragDefaults(simulation))

  node.on('click', (currentTask) => {
    console.debug({currentTask})
    console.debug(`opening UpdateTaskDialog with task of ${currentTask.target.__data__.obj.title}`)
    $q.dialog({
      component: UpdateTaskDialog,

      componentProps: {
        task: currentTask.target.__data__.obj
      }
    })
    .onOk(reInitializeGraph)
    .onCancel(reInitializeGraph)
    .onDismiss(reInitializeGraph)
  })
}

const reInitializeGraph = () => {
  simulation.stop()
  svg.selectAll('line').remove()
  svg.selectAll('.gnode').remove()
  svg.selectAll('defs').remove()
  populateGraphDataStructures()
  initializeGraph()
}

onMounted(initializeGraph)
</script>