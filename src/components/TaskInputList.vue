<template>
  <q-select
    v-model="selectedList"
    filled
    hide-selected
    fill-input
    input-debounce="20"
    :options="lists"
    use-chips
    option-label="title"
    map-options
    emit-value
    label="List"
    use-input
    option-value="id"
    class="q-my-md text-primary"
    @filter="filterSelection"
    @update:model-value="updateList"
  />
</template>

<script setup lang="ts">
  import { useRepo } from 'pinia-orm'
  import { Task } from 'src/stores/tasks/task-model'
  import { updateTask } from 'src/utils/task-utils'
  import { computed, ref } from 'vue'
  import { ListRepo } from 'src/stores/lists/list'

  const task = defineModel<Task>('task', { required: true })

  const listsRepo = useRepo(ListRepo)
  const lists = computed(() => listsRepo.all())

  const allLists = listsRepo.all()
  const listOptions = ref(allLists)

  function getSelectedList(task: Task) {
    return task.list ? { id: task.list.id, title: task.list.title } : null
  }

  const selectedList = ref(getSelectedList(task.value))

  // thank you Berichtsheft for concise type info on this piece of quasar api
  type voidFn = () => void
  type doneFn = (a: voidFn) => void

  const filterSelection = (val: string, update: doneFn) => {
    update(() => {
      if (val === '') {
        listOptions.value = allLists
      } else {
        const query = val.toLowerCase()
        listOptions.value = allLists.filter((x) => {
          return x.title.toLowerCase().includes(query)
        })
      }
    })
  }

  const updateList = () => {
    // FIXME: I have spent an hour trying to figure out why this is being dumb, I give up
    const whatTheActualFuck = typeof(selectedList.value) === 'number' ? selectedList.value : selectedList.value?.id
    updateTask(task.value.id, { list_id: whatTheActualFuck })
  }
</script>
