// Presentation only: these labels cannot grant rights or assert a release.
const labels={
 NO_PURCHASE:['No report purchased yet','尚未购买报告'],
 PENDING:['Awaiting payment','等待付款'],CHECKOUT_CREATED:['Awaiting payment','等待付款'],PAYMENT_PROCESSING:['Payment processing','付款处理中'],
 PAID:['Purchase confirmed','购买已确认'],FULFILLED:['Purchase confirmed','购买已确认'],
 INPUT_REQUIRED:['Your information is needed','请填写所需资料'],DATA_REQUIRED:['Your information is needed','请填写所需资料'],INTAKE_REQUIRED:['Your information is needed','请填写所需资料'],FULFILLMENT_PENDING:['Preparing your report · information may be needed','报告准备中 · 可能需要填写资料'],
 GENERATING:['Preparing your report','正在准备报告'],RETRYABLE_FAILURE:['Preparation interrupted · you can try again','准备过程暂时中断 · 可重试'],SUPPORT_REQUIRED:['Preparation needs support','准备过程需要支持人员协助'],
 RELEASED:['Released report','已发布报告'],ACTIVE:['Available','可用'],SUPERSEDED:['Previous version · replaced by a newer report','历史版本 · 已有新版报告'],
 PAYMENT_FAILED:['Payment failed','付款失败'],CANCELED:['Canceled','已取消'],REFUNDED:['Refunded · review pending','已退款 · 待复核'],PARTIALLY_REFUNDED:['Partially refunded · review pending','部分退款 · 待复核'],
 RELEASE_PENDING:['Report release is awaiting verification','报告等待发布核验'],UNAVAILABLE:['Report unavailable','报告暂不可用']
};
export function reportCustomerState(value,locale='en'){const entry=labels[value]||labels.UNAVAILABLE;return entry[locale==='zh-Hans'?1:0];}
