import checkedSfx from 'src/assets/task_checked.wav'
import uncheckedSfx from 'src/assets/task_unchecked.wav'

export function playCheckboxSound(checked: boolean) {
  if(checked) {
    const audio = new Audio(checkedSfx)
    audio.play()
  } else {
    const audio = new Audio(uncheckedSfx)
    audio.play()
  }
}
