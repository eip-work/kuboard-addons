let addon = {
  enabled: false,
  preFlight: function (context) {
    console.log('preflight do nothing in addon-mysql.js - ' + context.namespace)
  },
  nodes: [],
  pods: [],
  containers: []
}

async function openMySqlMonitor(context) {
  console.log('openMySqlMonitor', context)
  let dashboardUrl = undefined
  let failed = false
  this.loading = true
  await context.$monitorApi.get(`/namespace/${context.namespace}/service/monitor-grafana/port/3000/api/search?mode=tree&query=MySQL Overview&skipRecent=true&skipStarred=true&starred=false`).then(resp => {
    console.log(resp.data)
    for (let item of resp.data) {
      if (item.uri === 'db/mysql-overview') {
        dashboardUrl = item.url
      }
    }
  }).catch(e => {
    context.$message.error('调用 grafana 接口失败: ' + e)
    failed = true
    this.loading = false
  })
  if (failed) return
  let start = context.dateFns.getTime(context.dateFns.addHours(new Date(), -12)) / 1000
  let end = context.dateFns.getTime(new Date()) / 1000
  let instance = undefined
  await context.$monitorApi.get(`/namespace/${context.namespace}/service/monitor-grafana/port/3000/api/datasources/proxy/Prometheus/api/v1/series?match[]=mysql_up&start=${start}&end=${end}`).then(resp => {
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
  let url = `${dashboardUrl}?orgId=1&var-interval=$__auto_interval_interval&var-host=${instance}&from=now-1h&to=now&kiosk=tv`
  console.log('openMySqlMonitor', url)
  window.open(url, '_blank')
  this.loading = false
}

let mysqlMonitor = {
  title: "MySQL监控",
  loading: false,
  icon: 'el-icon-monitor',
  visible: function (context) {
    // console.log('检查MySql监控是否可见', context)
    return context.containerName.indexOf('db') === 0
  },
  openMonitoringPage: openMySqlMonitor
}

addon.containers.push(mysqlMonitor)

window.EIP_MONITOR_ADDON_TO_ACTIVATE = addon