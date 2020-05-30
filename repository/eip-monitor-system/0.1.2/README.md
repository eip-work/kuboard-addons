# eip-monitor-system

eip-monitor-system 是 [Kuboard](https://kuboard.cn) 的一个 [监控套件](https://kuboard.cn/guide/addon/)，可以：
* 快速安装 Prometheus + Grafana
* 快速初始化 Grafana dashboard：
  * [1621](https://grafana.com/grafana/dashboards/1621)
  * [1860](https://grafana.com/grafana/dashboards/1860)
  * [3146](https://grafana.com/grafana/dashboards/3146)
  * [8588](https://grafana.com/grafana/dashboards/8588)
* 在安装此套件后，可能会出现 etcd-certs not found 的错误，请在 K8S 的 Master 节点执行下面的指令：
  ``` sh
  kubectl -n kube-system create secret generic etcd-certs --from-file=/etc/kubernetes/pki/etcd/server.crt --from-file=/etc/kubernetes/pki/etcd/server.key
  ```
* 如需要对此监控套件做进一步定制，请参考 [监控套件](https://kuboard.cn/guide/addon/)
