import type { ToasterProps } from 'sonner'

let _position: ToasterProps['position'] | 'center' = 'bottom-right'
let _spring: boolean = true
let _bounce: number | undefined = undefined

export function setGoeyPosition(position: ToasterProps['position'] | 'center') {
  _position = position
}

export function getGoeyPosition() {
  return _position
}

export function setGoeySpring(spring: boolean) {
  _spring = spring
}

export function getGoeySpring() {
  return _spring
}

export function setGoeyBounce(bounce: number | undefined) {
  _bounce = bounce
}

export function getGoeyBounce() {
  return _bounce
}
