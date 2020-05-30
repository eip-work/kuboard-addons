async function installGrafanaDb (context, dbUrl, inputName) {
  let db = undefined
  try {
    let dbStr = context.boundle.data[dbUrl]
    console.log(dbStr)
    db = JSON.parse(dbStr)
  } catch(e) {
    context.$notify({
      title: `Dashboard ${dbUrl} 格式不对`,
      message: '错误原因: ' + e,
      type: 'error',
      duration: 0
    })
  }
  let dashboardCreate = {
    dashboard: db,
    folderId: 0,
    inputs: [{name: inputName, type: "datasource", pluginId: "prometheus", value: "Prometheus"}],
    overwrite: true
  }
  await context.$monitorApi.post(`/namespace/${context.namespace}/service/monitor-grafana/port/3000/api/dashboards/import`, dashboardCreate, {auth: {
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
    console.log('preFlight 2 - ' + context.namespace)
    context.$monitorApi.get(`/namespace/${context.namespace}/service/monitor-grafana/port/3000/api/datasources`, {auth: {
      username: 'admin',
      password: 'jmx09KT23BClpa7xzs'
    }}).then(async resp => {
      console.log('获取到 grafana 中已经安装的 dashboard', resp.data)
      let creatingDatasource = true
      for (let item of resp.data) {
        if (item.url === 'http://monitor-prometheus:9090') {
          creatingDatasource = false
        }
      }
      if (creatingDatasource) {
        let datasource = {
          name: "Prometheus",
          type: "prometheus",
          url: "http://monitor-prometheus:9090",
          orgId: 1,
          access:"proxy",
          basicAuth:false,
          readOnly: false,
          basicAuthPassword: '',
          basicAuthUser: '',
          database: '',
          isDefault: true,
          jsonData: {httpMethod: "GET", keepCookies: []},
          password: '',
          user: '',
          version: 1,
          withCredentials: false
        }
        await context.$monitorApi.post(`/namespace/${context.namespace}/service/monitor-grafana/port/3000/api/datasources`, datasource, {auth: {
          username: 'admin',
          password: 'jmx09KT23BClpa7xzs'
        }}).then(resp => {
          context.$notify({
            title: '创建 datasource 成功',
            message: `为 ${context.namespace} 的grafana 创建 prometheus datasource 成功`,
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
    }).catch(e => {
      console.error(e)
      if (e.response && (e.response.status === 404 || e.response.status === 502)) {
        this.$message.warning(`${this.name} 中未安装 eip 监控套件`)
      } else {
        context.$message.error('调用 grafana 接口失败: ' + e)
      }
    })
    console.log('初始化 dashbord')
    context.$monitorApi.get(`/namespace/${context.namespace}/service/monitor-grafana/port/3000/api/search?mode=tree&skipRecent=true&skipStarred=true&starred=false`, {auth: {
      username: 'admin',
      password: 'jmx09KT23BClpa7xzs'
    }}).then(async resp => {
      let dbs = {
        'db/jvm-micrometer': {
          json: 'resource_4701.json',
          ds: 'DS_PROMETHEUS'
        },
        'db/mysql-overview': {
          json: 'resource_7362.json',
          ds: 'DS_PROMETHEUS'
        },
        'db/nginx-vts-stats': {
          json: 'resource_2949.json',
          ds: 'DS_PROMETHEUS'
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
  },
  nodes: [],
  pods: [],
  containers: []
}

async function openNginxMonitor (context) {
  console.log('openNginxMonitor')
  let _this = this
  _this.loading = true
  context.$monitorApi.get(`/namespace/${context.namespace}/service/monitor-grafana/port/3000/api/search?mode=tree&query=Nginx VTS Stats&skipRecent=true&skipStarred=true&starred=false`).then(resp => {
    for (let item of resp.data) {
      if (item.uri === 'db/nginx-vts-stats') {
        dashboardUrl = item.url
        return Promise.resolve(item.url)
      }
    }
    return Promise.reject('未找到 dashbord: db/nginx-vts-stats')
  }).catch(e => {
    console.log(e)
    context.$message.error('调用 grafana 接口失败: ' + e)
    _this.loading = false
  }).then(dashboardUrl => {
    let start = context.dateFns.getTime(context.dateFns.addHours(new Date(), -12)) / 1000
    let end = context.dateFns.getTime(new Date()) / 1000
    let instance = undefined
    return context.$monitorApi.get(`/namespace/${context.namespace}/service/monitor-grafana/port/3000/api/datasources/proxy/Prometheus/api/v1/series?match[]=nginx_server_bytes&start=${start}&end=${end}`).then(resp => {
      for (let item of resp.data.data) {
        if (item.instance.indexOf(context.podIpAddress) === 0) {
          instance = item.instance
          return Promise.resolve({dashboardUrl, instance})
        }
      }
      context.$message.error('grafana 中未找到 12 小时内的监控数据')
      _this.loading = false
    })
  }).then(({dashboardUrl, instance}) => {
    // let url = `${dashboardUrl}?orgId=1&var-application=${container.name.toUpperCase()}&var-instance=${instance}&var-jvm_memory_pool_heap=All&var-jvm_memory_pool_nonheap=All&from=now-1h&to=now`
    let url = `${dashboardUrl}?orgId=1&var-Instance=${instance}&var-Host=All&var-Upstream=All&from=now-1h&to=now&kiosk=tv`
    console.log('openNginxMonitor', url)
    window.open(url, '_blank')
    _this.loading = false
  })
}

let NginxMonitor = {
  title: "Nginx 监控",
  loading: false,
  icon: 'el-icon-monitor',
  visible: function (context) {
    // console.log('检查Nginx监控是否可见', context)
    return context.containerName.indexOf('web') === 0
  },
  openMonitoringPage: openNginxMonitor
}

addon.containers.push(NginxMonitor)

window.EIP_MONITOR_ADDON_TO_ACTIVATE = addon
