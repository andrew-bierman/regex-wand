import { createExactRegExp, digit } from "regex-wand"

export const route = createExactRegExp("/users/", digit.times.atLeast(1).as("userId"))

export const acceptsUserRoute = route.test("/users/42")
export const userId = route.exec("/users/42")?.groups?.userId
