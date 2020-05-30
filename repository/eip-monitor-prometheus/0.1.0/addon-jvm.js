let addon = {
  enabled: false,
  preFlight: function (context) {
    console.log('preflight do nothing in addon-jvm.js - ' + context.namespace)
  },
  nodes: [],
  pods: [],
  containers: []
}

// --- containers
async function openJVMMonitor (context) {
  let dashboardUrl = undefined
  let failed = false
  this.loading = true
  await context.$monitorApi.get(`/namespace/${context.namespace}/service/monitor-grafana/port/3000/api/search?mode=tree&query=JVM&skipRecent=true&skipStarred=true&starred=false`).then(resp => {
    for (let item of resp.data) {
      if (item.uri === 'db/jvm-micrometer') {
        dashboardUrl = item.url
      }
    }
  }).catch(e => {
    context.$message.error('调用 grafana 接口失败: ' + e)
    failed = true
    this.loading = false
  })
  if (failed) return
  if (dashboardUrl === undefined) {
    context.$message.error('未找到 Dashboard: JVM (Micrometer)，请在 grafana 控制台中导入编号为 4701 的 Dashboard')
    this.loading = false
    return
  }
  let start = context.dateFns.getTime(context.dateFns.addHours(new Date(), -12)) / 1000
  let end = context.dateFns.getTime(new Date()) / 1000
  let instance = undefined
  // http://localhost:9080/grafana/pzy-test_k8s_namespace/api/datasources/proxy/5/api/v1/series?match[]=jvm_memory_used_bytes%7Bapplication%3D%22SVC-PRODUCT%22%7D&start=1559951596&end=1560037996
  await context.$monitorApi.get(`/namespace/${context.namespace}/service/monitor-grafana/port/3000/api/datasources/proxy/Prometheus/api/v1/series?match[]=jvm_memory_used_bytes%7Bapplication%3D%22${context.containerName.toUpperCase()}%22%7D&start=${start}&end=${end}`).then(resp => {
    console.log(resp.data)
    for (let item of resp.data.data) {
      if (item.instance.indexOf(context.podIpAddress) === 0) {
        instance = item.instance
        break
      }
    }
  }).catch(e => {
    context.$message.error('调用 grafana 接口失败: ' + e)
    failed = true
    this.loading = false
  })
  if (failed) return
  if (instance === undefined) {
    context.$message.error('grafana 中未找到 12 小时内的监控数据')
    this.loading = false
    return
  }
  let url = `${dashboardUrl}?orgId=1&var-application=${context.containerName.toUpperCase()}&var-instance=${instance}&var-jvm_memory_pool_heap=All&var-jvm_memory_pool_nonheap=All&from=now-1h&to=now&kiosk=tv`
  console.log('openJVMMonitor', url)
  window.open(url, '_blank')
  this.loading = false
}

let JvmMonitor = {
  title: "Java 虚拟机监控",
  loading: false,
  icon: 'el-icon-monitor',
  visible: function (context) {
    // console.log('检查JVM监控是否可见', context)
    return context.containerName.indexOf('svc') === 0 || context.containerName.indexOf('gateway') === 0
  },
  openMonitoringPage: openJVMMonitor
}

addon.containers.push(JvmMonitor)

window.EIP_MONITOR_ADDON_TO_ACTIVATE = addon