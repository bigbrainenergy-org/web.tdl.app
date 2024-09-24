<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" maximized data-cy="update_task_dialog" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Task Details</div>
        <ButtonBarComponent :buttons="topButtonBar" :target="currentTask as Task" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12 col-md">
            <q-item-label class="text-h4 text-primary" lines="3" data-cy="task_title">
              {{ currentTask.title }}
            </q-item-label>
            <TaskInputTitle :key="currentTask.id" v-model:task="currentTask as Task" />
            <TaskInputList :key="currentTask.id" v-model:task="currentTask as Task" />
            <TaskInputProcedures :key="currentTask.id" v-model:task="currentTask as Task" />
            <TaskInputRemindMeAt :key="currentTask.id" v-model:task="currentTask as Task" />
            <TaskInputEnergy :key="currentTask.id" v-model:task="currentTask as Task" />
            <br>
            <TaskInputNotes :key="currentTask.id" v-model:task="currentTask as Task" />
          </div>
          <div class="col-12 col-md">
            <IncompleteOnlyToggle />
            <DependencyList
              :items="allPres"
              :dependency-type="preDepType"
              :menu-items="prereqMenuItems"
              show-prune
              @prune-dependencies="prunePres"
              @add-item="openPrerequisiteDialog"
              @remove-item="removePre"
              @select-item="setCurrentTask"
              @toggle-completed-item="(x: Task) => x.updateTaskCompletionStatus()"
            />
            <DependencyList
              :items="allPosts"
              :dependency-type="postDepType"
              :menu-items="postreqMenuItems"
              show-prune
              @prune-dependencies="prunePosts"
              @add-item="openPostrequisiteDialog"
              @remove-item="removePost"
              @select-item="setCurrentTask"
              @toggle-completed-item="(x: Task) => x.updateTaskCompletionStatus()"
            />
            <div class="row">
              <div class="col">
                <div class="text-h5">Subtasks</div>
              </div>
              <div class="col text-right">
                <q-btn color="primary" icon="fas fa-tasks" label="Add Subtask" />
              </div>
            </div>
            <q-list class="q-my-md">
              <q-item v-ripple>
                <q-item-section>No subtasks</q-item-section>
              </q-item>
            </q-list>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
  import { useDialogPluginComponent, useQuasar, useMeta } from 'quasar'
  import { computed, ref } from 'vue'
  import DependencyList from '../DependencyList.vue'
  import { syncWithBackend } from 'src/utils/sync-utils'
  import { useLocalSettingsStore } from 'src/stores/local-settings/local-setting'
  import QuickPrioritizeDialog from './QuickPrioritizeDialog.vue'
  import {
    errorNotification,
    handleError,
    handleSuccess,
    notifySuccess
  } from 'src/utils/notification-utils'
  import TaskSearchDialog from './TaskSearchDialog.vue'
  import { Button, unknownishλ, λ } from 'src/utils/types'
  import { onMounted } from 'vue'
  import { useLoadingStateStore } from 'src/stores/performance/loading-state'
  import IncompleteOnlyToggle from 'src/components/Settings/IncompleteOnlyToggle.vue'
  import TaskInputTitle from 'src/components/TaskInputTitle.vue'
  import TaskInputList from 'src/components/TaskInputList.vue'
  import TaskInputProcedures from 'src/components/TaskInputProcedures.vue'
  import TaskInputRemindMeAt from 'src/components/TaskInputRemindMeAt.vue'
  import TaskInputEnergy from 'src/components/TaskInputEnergy.vue'
  import TaskInputNotes from 'src/components/TaskInputNotes.vue'
  import ButtonBarComponent from '../ButtonBarComponent.vue'

  import { storeToRefs } from 'pinia'
  import { hardCheck } from 'src/utils/type-utils'
  import {
    addPostrequisiteDialog,
    addPrerequisitesDialog,
    openTaskSlicerDialog
  } from 'src/utils/dialog-utils'
  import { blockingFunc } from 'src/utils/performance-utils'

  import { useTaskStore } from 'src/stores/tasks/task-store'
  import { Task } from 'src/stores/tasks/task-model'
  import { arrayDelete } from 'src/utils/array-utils'

  // HACK: The `:key="currentTask.id"` works for refreshing on task change, but isn't ideal
  // FIXME: Find a better way to switch between tasks

  // const props = defineProps({
  //   task: { type: Task, required: true }
  // })

  const props = defineProps<{
    task: Task
  }>()

  const currentTask = ref<Task>(props.task)

  // const currentTask = ref<Task>(new Task({ title: 'asdf' }))

  // const { task } = toRefs(props)

  // const currentTask = toRef(props, 'task')

  const prioritize = () => {
    $q.dialog({
      component: QuickPrioritizeDialog,
      componentProps: {
        task: currentTask.value
      }
    })
  }

  const topButtonBar = computed((): Button<Task>[] => {
    const action = (x: Task) => x.toggleCompleted()
    // why am I like this?
    const positiveColorButton = (label: string, action: unknownishλ<Task>) => ({
      color: 'positive',
      label,
      dataCy: 'why_are_you_like_this',
      action
    })
    const deleteButton = {
      color: 'negative',
      label: 'Delete',
      dataCy: 'delete_task_button',
      action: deleteTask
    }
    const markIncompleteButton = {
      color: 'primary',
      label: 'Mark Incomplete',
      dataCy: 'mark_incomplete_button',
      action
    }
    const closeButton = {
      color: 'grey',
      label: 'Close',
      dataCy: 'close_dialog',
      action: onDialogCancel
    }
    const markCompleteButton = positiveColorButton('Mark Complete', action)
    const prioritizeButton = positiveColorButton('Prioritize', prioritize)
    const sliceButton = positiveColorButton('Slice Task', openTaskSlicerDialog)
    if (currentTask.value.completed) return [markIncompleteButton, deleteButton, closeButton]
    return [markCompleteButton, prioritizeButton, sliceButton, deleteButton, closeButton]
  })

  const emit = defineEmits([...useDialogPluginComponent.emits])

  const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
  const $q = useQuasar()

  // const tr = useRepo(TaskRepo)
  const usr = useLocalSettingsStore()

  onMounted(() => {
    currentTask.value.hard_postreqs.sort(
      (a, b) => b.hard_postreq_ids.length - a.hard_postreq_ids.length
    )
    currentTask.value.hard_prereqs.sort(
      (a, b) => b.hard_postreq_ids.length - a.hard_postreq_ids.length
    )
  })

  let currentPre: Task | null = null
  // let currentPost: Task | null = null

  console.debug('UpdateTaskDialog: task prop value: ', currentTask.value)

  useMeta(() => ({ title: currentTask.value.title + ' | TDL App' }))

  const { hideCompleted } = storeToRefs(usr)

  const allPres = computed(() => currentTask.value.grabPrereqs(hideCompleted.value))
  const allPosts = computed(() => currentTask.value.grabPostreqs(hideCompleted.value))

  function setCurrentTask(newTask: Task) {
    console.debug('setCurrentTask')
    currentTask.value = newTask
  }

  function deleteTask(task: Task) {
    $q.dialog({
      title: `Delete task: "${task.title}"`,
      message: 'This cannot be undone! Are you sure?',
      ok: {
        label: 'Delete',
        color: 'negative'
      },
      cancel: {
        color: 'grey'
      }
    }).onOk(() => {
      console.debug('deleting task')
      useTaskStore()
        .apiDelete(task.id)
        .then(
          handleSuccess('Deleted task', 'fa-solid fa-tasks'),
          handleError('Failed to delete task.')
        )
    })
  }

  const openPrerequisiteDialog = () => addPrerequisitesDialog(currentTask.value as Task)
  const openPostrequisiteDialog = () => addPostrequisiteDialog(currentTask.value as Task)

  const mvpPostrequisite = async (post: Task) => {
    console.debug(post)
    const allOtherPosts = allPosts.value.filter((x) => !x.completed && x.id !== post.id)
    for (let i = 0; i < allOtherPosts.length; i++) {
      const pid = allOtherPosts[i].id
      arrayDelete(currentTask.value.hard_postreq_ids, pid)
      post.hard_postreq_ids.push(pid)
    }

    await useTaskStore().apiUpdate(currentTask.value.id, {
      hard_postreq_ids: currentTask.value.hard_postreq_ids
    })
    await useTaskStore().apiUpdate(post.id, { hard_postreq_ids: post.hard_postreq_ids })

    const syncResult = await syncWithBackend()
    if (syncResult === 1)
      errorNotification(new Error('Failed to refresh local storage'), 'Error Refreshing All')
    else notifySuccess('Refreshed All')
  }

  const insertBetweenPre = async (payload: { task: Task }) => {
    const oldPre = hardCheck(currentPre)
    await useTaskStore().removeRule(oldPre.id, currentTask.value.id)
    await useTaskStore()
      .addRule(oldPre.id, payload.task.id)
      .then(
        handleSuccess('successfully moved prerequisite!'),
        handleError('error moving prerequisite!')
      )
    if (!currentTask.value.hard_prereq_ids.includes(payload.task.id)) {
      await useTaskStore()
        .addRule(payload.task.id, currentTask.value.id)
        .then(
          handleSuccess('added new pre to current task'),
          handleError('error adding new pre to current task')
        )
    }
  }

  // when is a joke taken too far? - never, full send λ
  const insertBetweenFilter: λ<number | undefined, λ<Task, boolean>> =
    (taskID: number | undefined) => (x: Task) =>
      !x.completed

  const dialogInsertBetweenPost = (post: Task) => {
    notifySuccess('Coming soon')
    //   currentPost = post
    //   $q.dialog({
    //     component: TaskSearchDialog,
    //     componentProps: {
    //       dialogTitle: 'Insert Task Between Two Others',
    //       taskID: currentTaskID.value,
    //       searchLabel: 'Search',
    //       resultsTitle: 'Search Results',
    //       closeOnSelect: false,
    //       onSelect: insertBetweenPost,
    //       initialFilter: insertBetweenFilter,
    //       batchFilter: (taskID: number | undefined) => (tasks: Task[]) => {
    //         if (typeof taskID === 'undefined') {
    //           console.warn('task id is undefined')
    //           return []
    //         }
    //         const ct = useTaskStore().hardGet(taskID)
    //         if (ct === null) {
    //           console.warn('current task was not found (by id)')
    //           return []
    //         }
    //         const relationInfo = ct.anyIDsAbove(tasks.map((x) => x.id))
    //         if (currentPost === null) {
    //           console.warn('current postrequisite info was not passed in')
    //           return []
    //         }
    //         const postRelationInfo = currentPost.anyIDsBelow(tasks.map((x) => x.id))
    //         return tasks
    //           .filter((x) => relationInfo.get(x.id) !== true)
    //           .filter((x) => postRelationInfo.get(x.id) !== true)
    //       }
    //     }
    //   })
  }

  const dialogInsertBetweenPre = (pre: Task) => {
    currentPre = pre
    $q.dialog({
      component: TaskSearchDialog,
      componentProps: {
        dialogTitle: 'Insert Task Between Two Others',
        taskID: currentTask.value.id,
        searchLabel: 'Search',
        resultsTitle: 'Search Results',
        closeOnSelect: false,
        onSelect: insertBetweenPre,
        initialFilter: insertBetweenFilter,
        batchFilter: (taskID: number | undefined) => (tasks: Task[]) => {
          if (typeof taskID === 'undefined') {
            console.warn('task id is undefined')
            return []
          }
          const ct = useTaskStore().hardGet(taskID)
          if (ct === null) {
            console.warn('current task was not found (by id)')
            return []
          }
          const relationInfo = ct.anyIDsBelow(tasks.map((x) => x.id))
          if (currentPre === null) {
            console.warn('current prerequisite info was not passed in')
            return []
          }
          const preRelationInfo = currentPre.anyIDsAbove(tasks.map((x) => x.id))
          return tasks
            .filter((x) => relationInfo.get(x.id) !== true)
            .filter((x) => preRelationInfo.get(x.id) !== true)
        }
      }
    })
  }

  const preDepType = {
    plural: 'Prerequisites',
    singular: 'Prerequisite'
  } as const

  const postDepType = {
    plural: 'Postrequisites',
    singular: 'Postrequisite'
  } as const

  const prereqMenuItems = [
    {
      label: 'Unlink this Prerequisite',
      icon: 'fas fa-unlink',
      action: (x: Task) => useTaskStore().removeRule(x.id, currentTask.value.id)
    },
    {
      label: 'Add Task Between This Prereq and This Task',
      icon: 'fas fa-flask',
      action: dialogInsertBetweenPre
    }
  ]

  const postreqMenuItems = [
    {
      label: 'Unlink this Postrequisite',
      icon: 'fas fa-unlink',
      action: (x: Task) => useTaskStore().removeRule(currentTask.value.id, x.id)
    },
    {
      label: 'Move all Postreqs from Current Task to This Task',
      icon: 'fas fa-triangle-exclamation',
      action: mvpPostrequisite
    },
    {
      label: 'Add Task Between This Postreq and This Task',
      icon: 'fas fa-flask',
      action: dialogInsertBetweenPost
    }
  ]

  const prunePosts = blockingFunc(async (payload: { above: Set<number>; below: Set<number> }) => {
    useLoadingStateStore().busy = true
    const toRemove = allPosts.value.filter(
      (x) => payload.below.has(x.id) && !payload.above.has(x.id)
    )
    for (let i = 0; i < toRemove.length; i++) {
      await useTaskStore().removeRule(currentTask.value.id, toRemove[i].id)
    }
    useLoadingStateStore().busy = false
  })

  const prunePres = blockingFunc(async (payload: { above: Set<number>; below: Set<number> }) => {
    const toRemove = allPres.value.filter((x) => {
      const hasRelationsAbove = payload.above.has(x.id)
      const hasRelationsBelow = payload.below.has(x.id)
      console.log({ hasRelationsAbove, hasRelationsBelow, x })
      return hasRelationsAbove && !hasRelationsBelow
    })
    console.log('pruning prerequisites', { payload, toRemove })
    for (let i = 0; i < toRemove.length; i++) {
      await useTaskStore().removeRule(toRemove[i].id, currentTask.value.id)
    }
  })

  const removePre = (task: Task, id_of_prereq: number) => {
    useTaskStore()
      .removeRule(id_of_prereq, task.id)
      .then(handleSuccess('Removed a prerequisite'), handleError('Error removing the prerequisite'))
  }

  const removePost = (task: Task, id_of_postreq: number) => {
    useTaskStore()
      .removeRule(task.id, id_of_postreq)
      .then(handleSuccess('Removed a prerequisite'), handleError('Error removing the prerequisite'))
  }
</script>
