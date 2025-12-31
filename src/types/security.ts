/**
 * 安全相关类型定义
 */

/**
 * 敏感数据类型
 */
export type SensitiveDataType =
  | 'phone'
  | 'idCard'
  | 'email'
  | 'token'
  | 'password'
  | 'creditCard'
  | 'bankAccount'

/**
 * 敏感数据检测结果
 */
export interface SensitiveDataMatch {
  type: SensitiveDataType
  value: string
  masked: string
  position: {
    start: number
    end: number
  }
}

/**
 * 数据验证结果
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 安全警告
 */
export interface SecurityWarning {
  level: 'info' | 'warning' | 'error'
  message: string
  sensitiveData: SensitiveDataMatch[]
}
