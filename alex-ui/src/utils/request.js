import axios from 'axios'
import { Notification, MessageBox, Message, Loading } from 'element-ui'
import { getToken } from '@/utils/auth'
import errorCode from '@/utils/errorCode'
import { tansParams } from '@/utils/common'

axios.defaults.headers['Content-type'] = 'application/json;charset=utf-8'

const service = axios.create({
  timeout:10000
})

service.interceptors.request.use(config =>{
  //判断是否需要token
  const  isToken = (config.headers || {}).isToken === false;
  if (getToken() && !isToken) {
    config.headers['Authorization'] = 'Bearer ' + getToken() // 让每个请求携带自定义token
  }
  // get请求映射params参数
  if (config.method === 'get' && config.params) {
    let url = config.url + '?' + tansParams(config.params);
    url = url.slice(0, -1);
    config.params = {};
    config.url = url;
  }
  return config
  },
  error => {
    console.log(error);
    Promise.reject(error);
  })

service.interceptors.response.use(success =>{
  //如果未设置code 则默认为200
  const code = success.data.code || 200;
  //获取错误信息
  const msg = errorCode[code] || success.data.message ||errorCode['default']
  if(code == 401){
    MessageBox.confirm('登录状态已过期，您可以继续留在该页面，或者重新登录', '系统提示', {
        confirmButtonText: '重新登录',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      console.log('重新登录')
    }).catch(() => {});
    return Promise.reject('无效的会话，或者会话已过期，请重新登录。')
  } else if (code !== 200) {
    Notification.error({
      title: msg
    })
    return Promise.reject('error')
  } else {
    return success.data
  }
},error => {
  console.log('err' + error)
  let { message } = error;
  if (message == "Network Error") {
    message = "后端接口连接异常";
  }
  else if (message.includes("timeout")) {
    message = "系统接口请求超时";
  }
  else if (message.includes("Request failed with status code")) {
    message = "系统接口" + message.substr(message.length - 3) + "异常";
  }
  Message({
    message: message,
    type: 'error',
    duration: 5 * 1000
  })
  return Promise.reject(error)
})

export default service
