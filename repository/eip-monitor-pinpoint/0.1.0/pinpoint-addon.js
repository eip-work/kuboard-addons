let addon = {
  preFlight: function (context) {
    context.$notify({
      title: '初始化 Pinpoint监控套件',
      message: '初始化完成',
      type: 'success'
    })
  },
  nodes: [],
  pods: [],
  containers: []
}

async function openPinpointMonitor(context) {
  console.log('openPinpointMonitor', context)
  let failed = false
  let application = undefined
  this.loading = true
  await context.$monitorApi.get(`/namespace/${context.namespace}/service/monitor-pinpoint-web/port/8080/applications.pinpoint`).then(resp => {
    console.log(resp)
    for (let app of resp.data) {
      if (app.applicationName === context.containerName || context.podName.indexOf(app.applicationName) === 0) {
        application = app
      }
    }
    if (application === undefined) {
      context.$message.error('Pinpoint 未采集到对应的数据，在被监控的服务发生调用之后才有数据推送到 pinpoint')
      failed = true
      this.loading = false
    }
  }).catch(e => {
    console.error(e)
    context.$message.error('Pinpoint 接口调用失败: ' + e)
    failed = true
    this.loading = false
  })
  if (failed) return
  // http://localhost:9080/eip-monitor/namespace/pinpoint-test/service/monitor-pinpoint-web/port/8080/#/main/svc-auth@SPRING_BOOT/20m/2019-06-04-14-21-52
  let url = `/eip-monitor/namespace/${context.namespace}/service/monitor-pinpoint-web/port/8080/#main/${application.applicationName}@${application.serviceType}/1h/${context.dateFns.format(new Date(), 'YYYY-MM-DD-HH-mm-ss')}`
  console.log('openPinpointMonitor', url)
  window.open(url, '_blank')
  this.loading = false
}

let PinpointMonitor = {
  title: "链路追踪",
  loading: false,
  icon: 'el-icon-monitor',
  visible: function (context) {
    return context.containerName.indexOf('svc') === 0
  },
  openMonitoringPage: openPinpointMonitor
}

addon.containers.push(PinpointMonitor)

window.EIP_MONITOR_ADDON_TO_ACTIVATE = addon
