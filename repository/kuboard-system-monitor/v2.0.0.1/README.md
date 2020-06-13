# Kuboard资源监控套件

## 监控套件

基于 Prometheus/Grafana 实现 Kubernetes 的资源监控能力，并与 Kuboard 减免中的 Node/Pod 上下文整合，可以在 Kuboard 的节点详情页/Pod详情页，直接打开对应节点/Pod 的 Grafana 监控界面。


## 版本说明

### v2.0.0.1

* 在套件详情页增加 Prometheus 主页的入口

## 功能预览

完成此套件安装后，将在 Kuboard 的节点详情页、工作负载详情页显示对应的监控界面入口；

* 节点详情页

  节点详情页增加如下两个监控界面入口：

  * 节点资源监控
  * 节点监控（含节点上的容器组）

  ![image-20200607150745841](README.assets/image-20200607150745841.png)

* 工作负载详情页

  工作负载详情页增加如下三个监控界面入口：

  * 容器组监控
  * 所在节点监控
  * 所在节点监控（含节点上的容器组）

  ![image-20200607150811661](README.assets/image-20200607150811661.png)



## 直接访问 Grafana 界面



您可能想要自己定义 Grafana 的规则，比如告警通知、授权管理等，如果需要以管理员用户登录到 Grafana 界面，请以 kuboard-user 身份登录 Kuboard，点击套件详情页中的 **Grafana主页** 按钮（完成套件安装后才出现），如下图所示：



![image-20200611064330514](README.assets/image-20200611064330514.png)





关于如何通过 KuboardProxy 访问 Grafana 界面，以及如何实现 Grafana 与 Kuboard 的单点认证，请参考 [KuboardProxy - Auth Proxy](https://kuboard.cn/guide/proxy/auth-proxy.html)



## 授权普通用户访问监控套件

用户只要具备如下权限，即可访问此监控套件：

| 字段      | 值                           |
| --------- | ---------------------------- |
| apiGroup  | v1                           |
| resource  | services/proxy<br />services |
| namespace | kube-system                  |
| name      | monitor-grafana              |
| verb      | get                          |

授权过程描述如下：

* 套件出于 READY 状态后，点击图中的 ***授权用户使用此套件*** 按钮，按界面引导即可完成对普通用户的授权动作：

  ![image-20200611064229313](README.assets/image-20200611064229313.png)

## 开发者模式



在 Kuboard 套件的详情页面，可以点击 ***开发者模式*** 按钮，此时，您可以修改 Kuboard 套件安装过程的各种脚本，如：



* 增加套件参数

* 修改 YAML 安装脚本

* 修改初始化脚本、添加初始化所需资源

* 添加扩展，修改扩展脚本，实现自定义逻辑



如下图所示：

![image-20200607150839162](README.assets/image-20200607150839162.png)



您还可以将自己的套件提交到套件仓库。



## Limitations

暂时不提供告警等功能，用户可以尝试对此套件进行自定义设置。
