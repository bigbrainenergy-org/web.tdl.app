<template>
  <!-- notice dialogRef here -->
  <q-dialog ref="dialogRef" maximized data-cy="update_procedure_dialog" @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-card-section class="bg-primary text-white text-center">
        <div class="text-h6">Procedure Details</div>
        <ButtonBarComponent :buttons="topButtonBar" :target="procedure as Procedure" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="row q-gutter-md q-pa-sm">
          <div class="col-12 col-md">
            <q-item-label class="text-h4 text-primary" lines="3">{{
              procedure.title
            }}</q-item-label>
            <GloriousTextInput
              v-model="editTitle"
              label="Procedure Title"
              :placeholder="procedure.title"
              data-cy="task_title_input"
              @enter-key="updateProcedure({ title: editTitle })"
            />
          </div>
          <div class="col-12 col-md">
            <q-toggle
              v-model="incompleteOnly"
              label="Hide Completed Tasks"
              class="text-primary"
              left-label
            />
            <DependencyList
              :items="allTasks"
              :dependency-type="procedureDepType"
              :menu-items="procedureDependencyMenuItems"
              @add-item="openAddProcedureTaskDialog"
              @remove-item="tr.removePre"
              @select-item="openTask"
              @toggle-completed-item="updateTaskCompletedStatus"
            />
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
  import {
    AllOptionalProcedureProperties,
    Procedure,
    ProcedureRepo,
    UpdateProcedureOptions
  } from 'src/stores/procedures/procedure'
  import { useRepo } from 'pinia-orm'
  import { Utils } from 'src/util'
  import { Button, λ } from 'src/types'
  import GloriousTextInput from '../GloriousTextInput.vue'
  import ButtonBarComponent from '../ButtonBarComponent.vue'
  import { Task, TaskRepo } from 'src/stores/tasks/task'
  import { TDLAPP } from 'src/TDLAPP'

  const props = defineProps<{ procedure: Procedure }>()
  const procedureRef = ref(props.procedure)
  Utils.hardCheck(procedureRef.value)
  const pr = computed(() => useRepo(ProcedureRepo))

  const currentProcedure = computed(() => {
    const id = props.procedure.id
    if (id === null) throw new Error('no id')
    const t = useRepo(ProcedureRepo).withAll().find(id)
    if (typeof t === 'undefined' || t === null) {
      throw new Error('id does not match a procedure in the repo')
    }
    console.log({ t })
    return t
  })

  const procedureTasks = computed<Task[]>(() => {
    console.log('fetching proceduretasks again!!')
    const tr_tasks = useRepo(TaskRepo)
      .where((x) => x.procedure_ids.includes(props.procedure.id))
      .get()
    const prm_tasks = props.procedure.grabTasks()
    const tmp = props.procedure
    useRepo(ProcedureRepo).withAll().load([tmp])
    const tmp_tasks = tmp.tasks
    console.debug({ tr_tasks, prm_tasks, tmp_tasks })
    return tr_tasks
  })

  const incompleteOnly = ref(false)

  const resetProcedure = (x: Procedure) => {
    useRepo(ProcedureRepo)
      .resetProcedure(x.id)
      .then(() => {
        procedureTasks.effect
      })
  }

  const topButtonBar = computed((): Button<Procedure>[] => {
    // why am I like this?
    const deleteButton = {
      color: 'negative',
      label: 'Delete Procedure',
      dataCy: 'delete_task_button',
      action: deleteProcedure
    }
    const resetButton = {
      color: 'primary',
      label: 'Restart Procedure',
      dataCy: 'mark_incomplete_button',
      action: resetProcedure
    }
    const closeButton = {
      color: 'grey',
      label: 'Close',
      dataCy: 'close_dialog',
      action: onDialogCancel
    }
    return [deleteButton, resetButton, closeButton]
  })

  const emit = defineEmits([...useDialogPluginComponent.emits])

  const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
  const $q = useQuasar()
  const tr = useRepo(TaskRepo)

  // TODO: sort procedure tasks using the Agenda Sort algorithm
  // onMounted(() => {
  //   procedureRef.value.hard_postreqs.sort(
  //     (a, b) => b.hard_postreq_ids.length - a.hard_postreq_ids.length
  //   )
  // })

  useMeta(() => ({ title: procedureRef.value.title + ' | TDL App' }))

  const editTitle = ref(procedureRef.value.title)

  const allTasks = computed<Task[]>(() =>
    incompleteOnly.value ? procedureTasks.value.filter((x) => !x.completed) : procedureTasks.value
  )

  function deleteProcedure(procedure: Procedure) {
    $q.dialog({
      title: `Delete procedure: "${procedure.title}"`,
      message: 'This cannot be undone! Are you sure?',
      ok: {
        label: 'Delete',
        color: 'negative'
      },
      cancel: {
        color: 'grey'
      }
    }).onOk(() => {
      console.debug('deleting procedure')
      tr.deleteProcedure(procedure).then(
        Utils.handleSuccess('Deleted procedure', 'fa-solid fa-tasks'),
        Utils.handleError('Failed to delete procedure.')
      )
    })
  }

  function updateProcedure(options: AllOptionalProcedureProperties) {
    pr.value
      .update({
        id: procedureRef.value.id,
        payload: { procedure: options }
      })
      .then(() => {
        Utils.notifySuccess('Procedure Was Updated')
      }, Utils.handleError('Error updating procedure'))
  }

  const procedureDepType = {
    plural: 'Procedure Tasks',
    singular: 'Procedure Task'
  } as const

  const procedureDependencyMenuItems = [
    {
      label: 'Unlink this Task',
      icon: 'fas fa-unlink',
      action: (x: Task) => {
        const options: UpdateProcedureOptions = {
          id: procedureRef.value.id,
          payload: {
            procedure: {
              task_ids: procedureRef.value.task_ids
            }
          }
        }
        const { task_ids } = options.payload.procedure
        if (typeof task_ids === 'undefined') return
        const indexOfTask = task_ids.indexOf(x.id)
        if (indexOfTask < 0) return
        task_ids.splice(indexOfTask, 1)
        pr.value.update(options).then((response) => {
          if (response === null) throw new Error('response was null')
          Utils.notifySuccess('Unlinked a task.')
        }, Utils.handleError('Error unlinking a task.'))
      }
    }
  ]

  const openAddProcedureTaskDialog = () => {
    const assignTaskToProcedure = (payload: { task: Task }) => {
      const options: UpdateProcedureOptions = {
        id: procedureRef.value.id,
        payload: {
          procedure: procedureRef.value
        }
      }
      const { task_ids } = options.payload.procedure
      if (typeof task_ids === 'undefined') return
      if (task_ids.includes(payload.task.id)) return
      task_ids.push(payload.task.id)
      pr.value
        .update(options)
        .then(Utils.handleSuccess('Linked a task.'), Utils.handleError('Error linking a task.'))
    }
    const initialFilter: λ<number | undefined, λ<Task[], Task[]>> = () => {
      return (tasks: Task[]) => tasks.filter((x) => !procedureRef.value.task_ids.includes(x.id))
    }
    TDLAPP.searchDialog(assignTaskToProcedure, initialFilter)
  }

  const openTask = TDLAPP.openTask

  const updateTaskCompletedStatus = async (task: Task) => {
    const newStatus = task.completed
    console.debug(`marking ${task.id} ${newStatus ? 'completed' : 'incomplete'}.`)
    const result = await tr.updateAndCache({ id: task.id, payload: { task } })
    if (result.completed !== newStatus)
      throw new Error('result from update request is not the same as the status marked on UI')
  }
</script>
