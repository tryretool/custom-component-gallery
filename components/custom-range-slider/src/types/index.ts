export interface Bucket {
  bucket_index: number
  bucket_min: number
  bucket_max: number
  count: number
}

export interface ColorConfig {
  primary: string
  primaryLight: string
  secondary: string
  background: string
  text: string
  tooltip: string
}

export interface RangeSliderModel {
  min: number
  max: number
  defaultStart: number
  defaultEnd: number
  step: number
  label: string
  distributionData: Bucket[]
  formatterFunction: string
  colors: ColorConfig
}

export interface RangeOutput {
  start: number
  end: number
}
