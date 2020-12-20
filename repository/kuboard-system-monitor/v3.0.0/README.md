# Kuboard资源监控套件

## 监控套件

基于 Prometheus/Grafana 实现 Kubernetes 的资源监控能力，并与 Kuboard 减免中的 Node/Pod 上下文整合，可以在 Kuboard 的节点详情页/Pod详情页，直接打开对应节点/Pod 的 Grafana 监控界面。

本套件参考了 [kube-prometheus](https://github.com/prometheus-operator/kube-prometheus)，并在 kube-prometheus release-0.6.0 的基础上做了如下调整：
* 将工作负载部署到 kuboard 名称空间；
* 调整 Grafana 的上下文路径，以适配 KuboardProxy 的路径前缀；

在如下 Kubernetes 版本中做了验证：
* Kubernetes v1.19
* Kubernetes v1.18
* Kubernetes v1.17
* Kubernetes v1.16

已确认如下版本不支持此套件：
* Kubernetes v1.15
* Kubernetes v1.14
* Kubernetes v1.13

## Limitations

暂时不提供告警等功能，用户可以尝试对此套件进行自定义设置。
