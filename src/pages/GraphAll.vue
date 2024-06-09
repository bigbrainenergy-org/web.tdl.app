<template>
  <q-page class="q-pa-lg">
    <div class="row items-stretch justify-evenly">
      <div class="full-height">
        <q-card class="full-height q-pl-md text-primary" style="background-color: #1d1d1df6">
          <q-card-actions>
            <SettingsButton v-model:settings="graphSettings" name="Graph Settings" />
            <q-space />
            <q-btn label="Open Largest Task" class="text-primary" @click="openLargest" />
            <q-btn icon="fa-solid fa-search" class="text-primary" @click="openSearchDialog" />
          </q-card-actions>
          <svg id="graphElement" ref="graphRef"></svg>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useRepo } from 'pinia-orm'
import { Task, TaskRepo } from 'src/stores/tasks/task'
import * as d3 from 'd3'
import { computed, onMounted, ref, watch } from 'vue'
import { CustomForceGraph, d3Node } from 'src/models/d3-interfaces'
import { useQuasar, useMeta } from 'quasar'
import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
import { λ } from 'src/types'
import { TDLAPP } from 'src/TDLAPP'
import SettingsButton from 'src/components/SettingsButton.vue'

useMeta(
  () => {
    return {
      title: 'Graph | TDL App'
    }
  }
)

const tr = computed(() => useRepo(TaskRepo))
const usr = useLocalSettingsStore()
let allTasks
let allTaskNodes: d3Node<Task>[]

// size of the chart, not size of the viewport onto the chart
let width = 1000
let height = 1000

type d3Link<T> = d3.SimulationLinkDatum<d3Node<T>> & { slopeX: number, slopeY: number, angle: number, normalXoffset: number, normalYoffset: number }
let links: d3Link<Task>[]

const incompleteOnly = ref(usr.hideCompleted)
const taskNodeMaxSize = ref(usr.maxGraphNodeRadius)

const graphSettings = ref({ 'Hide Completed Tasks': incompleteOnly, 'Max Task Node Size': taskNodeMaxSize })

const reinit = () => reInitializeGraph()

watch(incompleteOnly,  () => {
  usr.hideCompleted = incompleteOnly.value
  reInitializeGraph()
})
watch(taskNodeMaxSize, () => {
  usr.maxGraphNodeRadius = taskNodeMaxSize.value
  reInitializeGraph()
})

console.log(graphSettings.value)

// todo: merge with other populate function
// todo: make less weird
// todo: optimize
const populateGraphDataStructures = () => {
  allTasks = tr.value.withAll().get()
  allTaskNodes = []
  links = []
  for(let i = 0; i < allTasks.length; i++) {
    allTaskNodes.push(allTasks[i].d3forceNode(i))
  }
  const taskNodeMap: Map<number, d3Node<Task>> = new Map<number, d3Node<Task>>()
  allTaskNodes.forEach((x) => taskNodeMap.set(x.id, x))
  links = links.concat(allTaskNodes.flatMap((x: d3Node<Task>) =>
    x.obj.hard_postreqs.filter(y => y.completed ? !usr.hideCompleted : true).map(y => ({
      source: x,
      target: taskNodeMap.get(y.id),
      slopeX: 1,
      slopeY: 1,
      normalXoffset: 1,
      normalYoffset: 1
    } as d3Link<Task>))
  ))
  console.log({links})
}

const populateGraphDataStructuresIncompleteOnly = () => {
  const incomplete: λ<Task, boolean> = (x: Task) => !x.completed
  allTasks = tr.value.where('completed', false).withAll().get()
  const taskNodeMap: Map<number, d3Node<Task>> = new Map<number, d3Node<Task>>()
  allTasks.forEach((x, i) => taskNodeMap.set(x.id, x.d3forceNode(i)))

  const generateD3LinkToPostreq: λ<d3Node<Task>, λ<Task, d3Link<Task>>> = (currentTaskNode: d3Node<Task>) => (currentPost: Task) => ({
    source: currentTaskNode,
    target: taskNodeMap.get(currentPost.id),
    slopeX: 1,
    slopeY: 1,
    normalXoffset: 1,
    normalYoffset: 1
  } as d3Link<Task>)

  const generateD3LinksToAllPostreqs: λ<d3Node<Task>, Array<d3Link<Task>>> = (currentTaskNode: d3Node<Task>) => currentTaskNode.obj.hard_postreqs.filter(incomplete).map(generateD3LinkToPostreq(currentTaskNode))

  allTaskNodes = Array.from(taskNodeMap.values())
  links = allTaskNodes.flatMap(generateD3LinksToAllPostreqs)
}

const populate = () => {
  if(incompleteOnly.value) populateGraphDataStructuresIncompleteOnly()
  else populateGraphDataStructures()
}

populate()

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

function raise(this: any) {
  d3.select(this.parentNode).raise()
}

const initializeGraph = () => {
  // updateSize()
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
      .attr('stroke-opacity', '0.5')
      .attr('marker-end', 'url(#arrowhead)')

  node = gnodes
    .append('circle')
    .attr('r', (d: d3Node<Task>) => d.radius)
    .attr('fill', (d: d3Node<Task>) => d.color)
    .on('mouseover', raise)

  label = gnodes.filter((x: d3Node<Task>) => !x.obj.completed && (x.radius >= 12 || x.obj.hard_prereqs.filter(x => !x.completed).length === 0))
    .append('text')
    .text((d: d3Node<Task>) => d.obj.title)
    .style('font', '1.2em')
    .attr('stroke', 'black')
    .attr('stroke-width', '0.3em')
    .attr('class', 'text-primary')
    .attr('fill', '#DDD')
    .attr('paint-order', 'stroke')

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  svg.call(CustomForceGraph.d3PanAndGeometricZoom(gg))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  node.call(CustomForceGraph.d3DragDefaults(simulation))

  node.on('click', (event) => {
    TDLAPP.openTask(event.target.__data__.obj as Task)
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
  populate()
  initializeGraph()
  usr.hideCompleted = incompleteOnly.value
}

const toggleIncompleteOnly = () => {
  incompleteOnly.value = !incompleteOnly.value
  reInitializeGraph()
}

const refresh = reInitializeGraph

onMounted(initializeGraph)

const openSearchDialog = () => TDLAPP.searchDialog()
const biggest = (prev: d3Node<Task>, curr: d3Node<Task>) => curr.radius > prev.radius ? curr : prev
const openLargest = () => TDLAPP.openTask(allTaskNodes.reduce(biggest).obj)
  .onOk(reInitializeGraph)
  .onCancel(reInitializeGraph)
  .onDismiss(reInitializeGraph)
</script>

<style>
svg text{
   -webkit-user-select: none;
   -moz-user-select: none;
   -ms-user-select: none;
   user-select: none;
}
</style>