import ms from 'ms'

export const convertToMs = time => {
  if (typeof time === 'number') return time
  if (typeof time === 'string') {
    return ms(time)
  }
  return 1000
}

export const sleep = ms => new Promise(res => setTimeout(res, ms))
