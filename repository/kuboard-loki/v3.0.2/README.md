# Kuboard 日志聚合套件

## 介绍

基于 Grafana + Loki + Promtail 实现 <a href="https://kuboard.cn/learning/k8s-advanced/logs/cluster.html" target="_blank">集群级别的日志聚合</a>

Grafana + Loki + Promtail 相较于 ElasticSearch + Filebeats + Kibana 有如下优势：

* Loki 只对标签做索引，不对日志内容做索引，占用资源小；
* 使用习惯与监控套件相似；

缺点：

* Loki 只对标签做索引，不对日志内容做索引，因此不能根据日志的内容进行检索；



## 功能预览

安装完此套件后，将在 Kuboard 的工作负载详情页的容器组区域和容器区域显示对应的日志查看入口：

* 查看容器组的日志

  ![image-20200609223404603](README.assets/image-20200609223404603.png)

* 查看容器的日志

  ![image-20200609223514774](README.assets/image-20200609223514774.png)



## 授权普通用户访问监控套件

用户只要具备如下权限，即可访问此监控套件：

| 字段      | 值                           |
| --------- | ---------------------------- |
| apiGroup  | v1                           |
| resource  | services                     |
| namespace | kube-system                  |
| name      | kuboard-loki-grafana         |
| verb      | get                          |


## 更新记录

### v3.0.2

更新日期：2020-12-27

* 更新 loki / promtail 版本为 v2.1.0
* 更新 grafana 版本为 v7.3.5

### v3.0.1

更新日期：2020-12-08

* 参数化 LOKI_RETENTION_PERIOD
