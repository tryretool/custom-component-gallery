export interface RadioOption {
  id: string
  title: string
  description?: string
  disabled?: boolean
  renderAsHtml?: boolean
  icon?: string
  iconPosition?: 'left' | 'right'
  badge?: string
  badgeColor?: string
  showIf?: string
}

export interface GroupHeader {
  type: 'header'
  title: string
  id?: string
}

export type ButtonShape =
  | 'bullet'
  | 'square'
  | 'diamond'
  | 'rounded-square'

export type ButtonPosition = 'left' | 'right' | 'top' | 'bottom'

export type LayoutMode = 'vertical' | 'horizontal' | 'grid' | 'justified'

export interface ColorConfig {
  primary: string
  primaryLight: string
  background: string
  borderColor: string
  titleColor: string
  descriptionColor: string
  disabledColor: string
  hoverColor: string
}

export interface RadioGroupModel {
  options: RadioOption[]
  selectedValue: string
  buttonSize: number
  buttonShape: ButtonShape
  colors: ColorConfig
}
