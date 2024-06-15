import { Ref } from 'vue'
import { λ } from './types'

export interface GloriousSliderProp {
  beginIcon?: string
  endIcon?: string
  min?: number
  max?: number
  step?: number
  cuteName?: string
  color?: string
}
/**
 * @abstract to fully configure Glorious Slider. Especially useful for lists of slider components.
 */
export interface GloriousSliderConfig extends GloriousSliderProp {
  modelRef: Ref<number>
  updateFunc: λ<number, any>
}
