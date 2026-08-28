import {evaluateZiweiPatterns} from './ziwei-pattern-runtime.js';
import {assertZiweiPatternRuleAdmission} from './ziwei-pattern-rule-authority-v1.js';
export const ZIWEI_ADMITTED_PATTERN_RUNTIME_VERSION='1.0.0';
export function evaluateAdmittedZiweiPatterns({combinations}={}){
 const registry=assertZiweiPatternRuleAdmission();
 return evaluateZiweiPatterns({combinations,patternRuleRegistry:registry,executionMode:'PRODUCTION'});
}
export default Object.freeze({evaluateAdmittedZiweiPatterns});
