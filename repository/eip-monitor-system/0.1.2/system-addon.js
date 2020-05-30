async function installGrafanaDb (context, dbUrl, inputName) {
  let db = undefined
  try {
    db = JSON.parse(context.boundle.data[dbUrl])
  } catch(e) {
    context.$notify({
      title: `Dashboard ${dbUrl} 格式不对`,
      message: '错误原因: ' + e,
      type: 'success',
      duration: 0
    })
  }
  let dashboardCreate = {
    dashboard: db,
    folderId: 0,
    inputs: [{name: inputName, type: "datasource", pluginId: "prometheus", value: "Prometheus"}],
    overwrite: true
  }
  await context.$monitorApi.post('/namespace/kube-system/service/monitor-grafana/port/3000/api/dashboards/import', dashboardCreate, {auth: {
    username: 'admin',
    password: 'jmx09KT23BClpa7xzs'
  }}).then(resp => {
    console.log('创建 dashboard 成功', resp.data)
    context.$notify({
      title: '创建 dashboard 成功',
      message: dbUrl,
      type: 'success',
      duration: 5000
    });
  }).catch(e => {
    console.error(`创建 dashboard 失败 ${dbUrl}:  ${e}`)
  })
}

let addon = {
  preFlight: function (context) {
    console.log('preFlight', context)
    context.$monitorApi.get(`/namespace/kube-system/service/monitor-grafana/port/3000/api/datasources`, {auth: {
      username: 'admin',
      password: 'jmx09KT23BClpa7xzs'
    }}).then(async resp => {
      console.log('datasources', resp.data)
      let creatingDatasource = true
      for (let item of resp.data) {
        if (item.url === 'http://monitor-prometheus:9090') {
          creatingDatasource = false
        }
      }
      if (creatingDatasource) {
        let datasource = {
          "name": "Prometheus",
          "type": "prometheus",
          "url": "http://monitor-prometheus:9090",
          "orgId": 1,
          "access":"proxy",
          "basicAuth":false,
          "readOnly": false,
          "password": ''
        }
        await context.$monitorApi.post(`/namespace/kube-system/service/monitor-grafana/port/3000/api/datasources`, datasource, {auth: {
          username: 'admin',
          password: 'jmx09KT23BClpa7xzs'
        }}).then(resp => {
          context.$notify({
            title: '创建 datasource 成功',
            message: `为 kube-system 的grafana 创建 prometheus datasource 成功`,
            type: 'success',
            duration: 5000
          });
        }).catch(e => {
          console.error(e)
          context.$message.error('调用 grafana 接口创建 datasource 失败: ' + e)
        })
      } else {
        context.$notify({title: '无需重复创建', message: 'promethues datasource 已存在，无需重复创建', type: 'success'})
      }
      context.$monitorApi.get(`/namespace/kube-system/service/monitor-grafana/port/3000/api/search?mode=tree&skipRecent=true&skipStarred=true&starred=false`, {auth: {
        username: 'admin',
        password: 'jmx09KT23BClpa7xzs'
      }}).then(async resp => {
        let dbs = {
          'db/1-kubernetes-deployment-statefulset-daemonset-metrics': {
            json: 'resource_8588.json',
            ds: 'DS_PROMETHEUS'
          },
          'db/kubernetes-cluster-monitoring-via-prometheus': {
            json: 'resource_1621.json',
            ds: 'DS_PROMETHEUS'
          },
          'db/kubernetes-pods': {
            json: 'resource_3146.json',
            ds: 'DS_PROMETHEUS'
          },
          'db/node-exporter-full': {
            json: 'resource_1860.json',
            ds: 'DS_LOCALHOST'
          }
        }
        for (let db of resp.data) { // 不再创建已经存在的 dashboard
          console.log(db.uri)
          delete dbs[db.uri]
        }
        if (resp.data.length > 0) {
          context.$notify({title: '无需重复创建', message: `Grafana 中已存在 ${resp.data.length} 个 Dashboard，将不会重复创建`, type: 'warning'})
        }
        for (let i in dbs) {
          await installGrafanaDb(context, dbs[i].json, dbs[i].ds)
        }
      })
    }).catch(e => {
      console.error(e)
      if (e.response && e.response.status === 404 || e.response.status === 502) {
        context.$message.warning(`kube-system 中未安装 eip 监控套件`)
      } else {
        context.$message.error('调用 grafana 接口失败: ' + e)
      }
    })
  },
  nodes: [],
  pods: [],
  containers: []
}

// --- nodes monitor

function openNodeMonitor (context) {
  console.log('openNodeMonitor')
  this.loading = true
  context.$monitorApi.get(`/namespace/kube-system/service/monitor-grafana/port/3000/api/search?mode=tree&query=Node Exporter&skipRecent=true&skipStarred=true&starred=false`, {auth: {
    username: 'admin',
    password: 'jmx09KT23BClpa7xzs'
  }}).then(resp => {
    for (let item of resp.data) {
      if (item.uri === 'db/node-exporter-full') {
        return Promise.resolve(item.url)
      }
    }
    return Promise.reject('未找到 dashbord: db/node-exporter-full')
  }).catch(e => {
    this.loading = false
    context.$message.error('调用 grafana 接口失败: ' + e)
  }).then(dashboardUrl => {
    let hostIP = context.nodeIpAddress
    let url = `${dashboardUrl}?orgId=1&var-job=applications-service-metrics&var-node=${hostIP}&from=now-1h&to=now&kiosk=tv&refresh=10s`
    console.log('openNodeMonitor', url)
    window.open(url, '_blank')
    this.loading = false
  })
}

function openNodeMonitorPodContainer (context) {
  console.log('openNodeMonitorPodContainer')
  this.loading = true
  context.$monitorApi.get(`/namespace/kube-system/service/monitor-grafana/port/3000/api/search?mode=tree&query=Kubernetes cluster monitoring&skipRecent=true&skipStarred=true&starred=false`, {auth: {
    username: 'admin',
    password: 'jmx09KT23BClpa7xzs'
  }}).then(resp => {
    for (let item of resp.data) {
      if (item.uri === 'db/kubernetes-cluster-monitoring-via-prometheus') {
        return Promise.resolve(item.url)
      }
    }
  }).catch(e => {
    context.$message.error('调用 grafana 接口失败: ' + e)
    this.loading = false
  }).then(dashboardUrl => {
    console.log(dashboardUrl)
    let url = `${dashboardUrl}?orgId=1&var-job=applications-service-metrics&var-Node=${context.nodeName}&from=now-1h&to=now&kiosk=tv&refresh=10s`
    console.log('openNodeMonitorPodContainer', url)
    window.open(url, '_blank')
    this.loading = false
  })
}

let nodeMonitorContainers = {
  title: "节点监控（含节点上的容器组）",
  icon: 'el-icon-monitor',
  loading: false,
  visible: function (context) {
    // console.log('检查节点-容器组监控是否可见', context)
    return true
  },
  openMonitoringPage: openNodeMonitorPodContainer
}

let nodeMonitor = {
  title: "节点监控",
  icon: 'el-icon-monitor',
  loading: false,
  visible: function (context) {
    // console.log('检查节点监控是否可见', context)
    return true
  },
  openMonitoringPage: openNodeMonitor
}

addon.nodes.push(nodeMonitor)
addon.nodes.push(nodeMonitorContainers)


// ---- pods monitor
async function openNodeMonitorFromPod (context) {
  console.log('openNodeMonitor')
  let dashboardUrl = undefined
  let failed = false
  this.loading = true
  await context.$monitorApi.get(`/namespace/kube-system/service/monitor-grafana/port/3000/api/search?mode=tree&query=Node Exporter&skipRecent=true&skipStarred=true&starred=false`, {auth: {
    username: 'admin',
    password: 'jmx09KT23BClpa7xzs'
  }}).then(resp => {
    for (let item of resp.data) {
      if (item.uri === 'db/node-exporter-full') {
        dashboardUrl = item.url
      }
    }
  }).catch(e => {
    context.$message.error('调用 grafana 接口失败: ' + e)
    failed = true
    this.loading = false
  })
  console.log(dashboardUrl)
  if (failed) return
  let url = `${dashboardUrl}?orgId=1&var-job=applications-service-metrics&var-node=${context.nodeIpAddress}&from=now-1h&to=now&kiosk=tv`
  console.log('openNodeMonitor', url)
  window.open(url, '_blank')
  this.loading = false
}

async function openNodeMonitorPodContainerFromPod (context) {
  console.log('openNodeMonitorPodContainer')
  let dashboardUrl = undefined
  let failed = false
  this.loading = true
  await context.$monitorApi.get(`/namespace/kube-system/service/monitor-grafana/port/3000/api/search?mode=tree&query=Kubernetes cluster monitoring&skipRecent=true&skipStarred=true&starred=false`, {auth: {
    username: 'admin',
    password: 'jmx09KT23BClpa7xzs'
  }}).then(resp => {
    for (let item of resp.data) {
      if (item.uri === 'db/kubernetes-cluster-monitoring-via-prometheus') {
        dashboardUrl = item.url
      }
    }
  }).catch(e => {
    context.$message.error('调用 grafana 接口失败: ' + e)
    failed = true
    this.loading = false
  })
  console.log(dashboardUrl)
  if (failed) return
  let nodeName = undefined
  await context.$k8sApi.get('/api/v1/nodes').then(resp => {
    for (let item of resp.data.items) {
      for (let addr of item.status.addresses) {
        if (addr.address === context.nodeIpAddress) {
          nodeName = item.metadata.name
        }
      }
    }
  }).catch(e => {
    context.$message.error('调用 k8s 接口失败: ' + e)
    failed = true
    this.loading = false
  })
  if (failed) return
  let url = `${dashboardUrl}?orgId=1&var-job=applications-service-metrics&var-Node=${nodeName}&from=now-1h&to=now&kiosk=tv`
  console.log('openNodeMonitorPodContainer', url)
  window.open(url, '_blank')
  this.loading = false
}

async function openPodMonitor (context) {
  console.log('openPodMonitor')
  let dashboardUrl = undefined
  let failed = false
  this.loading = true
  await context.$monitorApi.get(`/namespace/kube-system/service/monitor-grafana/port/3000/api/search?mode=tree&query=Kubernetes Pods&skipRecent=true&skipStarred=true&starred=false`, {auth: {
    username: 'admin',
    password: 'jmx09KT23BClpa7xzs'
  }}).then(resp => {
    for (let item of resp.data) {
      if (item.uri === 'db/kubernetes-pods') {
        dashboardUrl = item.url
      }
    }
    if (dashboardUrl === undefined) {
      context.$message.error('未找到 dashboard: db/kubernetes-pods, 请导入 dashboard 6336')
      failed = true
      this.loading = false
    }
  }).catch(e => {
    context.$message.error('调用 grafana 接口失败: ' + e)
    failed = true
    this.loading = false
  })
  console.log(dashboardUrl)
  if (failed) return
  // http://localhost:9080/grafana/kube-system_k8s_namespace/d/txEmY8kik/kubernetes-pods-prometheus?orgId=1&var-namespace=All&var-pod=web-admin-69d9dc7894-bn6qq&var-container=All
  let url = `${dashboardUrl}?orgId=1&var-job=applications-service-metrics&var-namespace=${context.namespace}&var-pod=${context.podName}&var-container=All&from=now-1h&to=now&kiosk=tv`
  console.log('openPodMonitor', url)
  window.open(url, '_blank')
  this.loading = false
}

let nodeMonitorContainersOnPod = {
  title: "所在节点监控（含节点上的容器组）",
  icon: 'el-icon-monitor',
  loading: false,
  visible: function (context) {
    // console.log('检查节点-容器组监控是否可见 pod', context)
    return true
  },
  openMonitoringPage: openNodeMonitorPodContainerFromPod
}

let nodeMonitorOnPod = {
  title: "所在节点监控",
  icon: 'el-icon-monitor',
  loading: false,
  visible: function (context) {
    // console.log('检查节点监控是否可见 pod', context)
    return true
  },
  openMonitoringPage: openNodeMonitorFromPod
}

let podMonitor = {
  title: "容器组监控",
  icon: 'el-icon-monitor',
  loading: false,
  visible: function (context) {
    // console.log('检查节点监控是否可见 pod', context)
    return true
  },
  openMonitoringPage: openPodMonitor
}

addon.pods.push(podMonitor)
addon.pods.push(nodeMonitorOnPod)
addon.pods.push(nodeMonitorContainersOnPod)

window.EIP_MONITOR_ADDON_TO_ACTIVATE = addon
