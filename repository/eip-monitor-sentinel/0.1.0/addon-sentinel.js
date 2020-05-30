let addon = {
  preFlight: function (context) {
    console.log('preFlight 2 - ' + context.namespace)
    context.$notify({
      title: '尚未实现',
      message: 'sentinel 的监控入口尚未实现'
    })
  },
  nodes: [],
  pods: [],
  containers: []
}

window.EIP_MONITOR_ADDON_TO_ACTIVATE = addon
