/**
 * 敏感数据检测工具
 */

import type { SensitiveDataType, SensitiveDataMatch } from '@/types/security'

/**
 * 敏感数据检测规则
 */
const SENSITIVE_PATTERNS: Record<SensitiveDataType, RegExp> = {
  // 手机号：1开头的11位数字
  phone: /1[3-9]\d{9}/g,
  
  // 身份证号：18位数字或17位数字+X
  idCard: /\d{17}[\dXx]/g,
  
  // 邮箱
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  
  // Token：常见的 JWT 或 API Token 格式
  token: /(?:Bearer\s+)?[A-Za-z0-9_-]{20,}/g,
  
  // 密码字段（键名包含 password、pwd、pass 等）
  password: /(?:password|pwd|pass|secret)/i,
  
  // 信用卡号：13-19位数字
  creditCard: /\d{13,19}/g,
  
  // 银行账号：10-20位数字
  bankAccount: /\d{10,20}/g
}

/**
 * 检测文本中的敏感数据
 */
export function detectSensitiveData(text: string): SensitiveDataMatch[] {
  const matches: SensitiveDataMatch[] = []

  for (const [type, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
    const regex = new RegExp(pattern.source, pattern.flags)
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      const value = match[0]
      matches.push({
        type: type as SensitiveDataType,
        value,
        masked: maskSensitiveData(value, type as SensitiveDataType),
        position: {
          start: match.index,
          end: match.index + value.length
        }
      })
    }
  }

  return matches
}

/**
 * 检测键名是否为敏感字段
 */
export function isSensitiveKey(key: string): boolean {
  const sensitiveKeywords = [
    'password', 'pwd', 'pass', 'secret', 'token', 'auth',
    'credential', 'key', 'apikey', 'api_key', 'access_token',
    'refresh_token', 'session', 'cookie'
  ]

  const lowerKey = key.toLowerCase()
  return sensitiveKeywords.some(keyword => lowerKey.includes(keyword))
}

/**
 * 脱敏处理
 */
export function maskSensitiveData(
  value: string,
  type: SensitiveDataType
): string {
  switch (type) {
    case 'phone':
      // 手机号：138****5678
      return value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    
    case 'idCard':
      // 身份证：110***********1234
      return value.replace(/(\d{3})\d{11}(\d{4})/, '$1***********$2')
    
    case 'email':
      // 邮箱：u***@example.com
      const [username, domain] = value.split('@')
      const maskedUsername = username.charAt(0) + '***'
      return `${maskedUsername}@${domain}`
    
    case 'token':
      // Token：显示前6位和后4位
      if (value.length <= 10) return '***'
      return `${value.slice(0, 6)}...${value.slice(-4)}`
    
    case 'password':
      // 密码：完全隐藏
      return '********'
    
    case 'creditCard':
      // 信用卡：**** **** **** 1234
      return value.replace(/\d(?=\d{4})/g, '*')
    
    case 'bankAccount':
      // 银行账号：显示后4位
      return '*'.repeat(value.length - 4) + value.slice(-4)
    
    default:
      return '***'
  }
}

/**
 * 检测并脱敏整个对象
 */
export function maskSensitiveObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => maskSensitiveObject(item))
  }

  const masked: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      masked[key] = '********'
    } else if (typeof value === 'string') {
      const matches = detectSensitiveData(value)
      if (matches.length > 0) {
        let maskedValue = value
        // 从后往前替换，避免位置偏移
        for (let i = matches.length - 1; i >= 0; i--) {
          const match = matches[i]
          maskedValue =
            maskedValue.slice(0, match.position.start) +
            match.masked +
            maskedValue.slice(match.position.end)
        }
        masked[key] = maskedValue
      } else {
        masked[key] = value
      }
    } else if (typeof value === 'object') {
      masked[key] = maskSensitiveObject(value)
    } else {
      masked[key] = value
    }
  }

  return masked
}

/**
 * 检查数据是否包含敏感信息
 */
export function hasSensitiveData(text: string): boolean {
  return detectSensitiveData(text).length > 0
}
