import { Override } from 'src/utils/type-utils'
import {
  RouteRecordMultipleViews,
  RouteRecordMultipleViewsWithChildren,
  RouteRecordRedirect,
  RouteRecordSingleView,
  RouteRecordSingleViewWithChildren
} from 'vue-router'
import { RouteName, RoutePath } from './routes'

export const PageNameBuiltins = ['', '/'] as const

type _RoutePath = RoutePath | '/:catchAll(.*)*'

type BaseOverrides = {
  path: _RoutePath
  name?: RouteName
}
type BaseOverridesWithChildren = BaseOverrides & { children: StronglyTypedRouteRecordRaw[] }

type R̷̬̻̳̩̥̈́͐͌̍̕ = Override<RouteRecordSingleView, BaseOverrides>
type Ę̸̴̷̵̶̷̛̖̘̜̝̞̟̠̊͋͌̍ = Override<RouteRecordMultipleViewsWithChildren, BaseOverridesWithChildren>
type E̷̢̛̖̘̜̝̞̟̠̊͋͌̍̎̏ = Override<RouteRecordSingleViewWithChildren, BaseOverridesWithChildren>
type Ę̶̷̵̶̷̨̛̰̱̲̳̹̺̻̼͇͈͉͊͋ = Override<RouteRecordMultipleViews, BaseOverrides>
type Ȩ̵̛͓͉̫͓̦̪̱͔̖̻̈́̓͌̀͐̅̉͗̀̊͠ = Override<RouteRecordRedirect, BaseOverrides>

export type StronglyTypedRouteRecordRaw = R̷̬̻̳̩̥̈́͐͌̍̕ | Ę̶̷̵̶̷̨̛̰̱̲̳̹̺̻̼͇͈͉͊͋ | Ę̸̴̷̵̶̷̛̖̘̜̝̞̟̠̊͋͌̍ | E̷̢̛̖̘̜̝̞̟̠̊͋͌̍̎̏ | Ȩ̵̛͓͉̫͓̦̪̱͔̖̻̈́̓͌̀͐̅̉͗̀̊͠
