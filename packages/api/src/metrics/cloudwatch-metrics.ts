// CloudWatch Metrics para DriCloud
import { CloudWatch } from 'aws-sdk';

export class DriCloudMetrics {
  private cloudWatch: CloudWatch;
  
  constructor() {
    this.cloudWatch = new CloudWatch({
      region: 'eu-north-1', // Tu región correcta
      // Las credenciales se obtienen automáticamente del AWS CLI configurado
    });
  }
  
  // Métricas de tokens
  async publishTokenMetrics(stats: any) {
    const params = {
      Namespace: 'GUA/DriCloud',
      MetricData: [
        {
          MetricName: 'TokenRefreshCount',
          Value: stats.refreshCount,
          Unit: 'Count',
          Timestamp: new Date()
        },
        {
          MetricName: 'TokenRefreshFrequency',
          Value: this.calculateRefreshFrequency(stats),
          Unit: 'Count/Second',
          Timestamp: new Date()
        },
        {
          MetricName: 'RequestCount',
          Value: stats.requestCount,
          Unit: 'Count',
          Timestamp: new Date()
        },
        {
          MetricName: 'ErrorCount',
          Value: stats.errorCount || 0,
          Unit: 'Count',
          Timestamp: new Date()
        }
      ]
    };
    
    await this.cloudWatch.putMetricData(params).promise();
  }
  
  // Alarmas automáticas
  async createAlarms() {
    // Alarma si hay >3 renovaciones en 5 minutos
    await this.cloudWatch.putMetricAlarm({
      AlarmName: 'DriCloud-HighTokenRefresh',
      ComparisonOperator: 'GreaterThanThreshold',
      EvaluationPeriods: 1,
      MetricName: 'TokenRefreshCount',
      Namespace: 'GUA/DriCloud',
      Period: 300, // 5 minutos
      Statistic: 'Sum',
      Threshold: 3,
      ActionsEnabled: true,
      AlarmActions: ['arn:aws:sns:eu-west-1:123456789012:dricloud-alerts']
    }).promise();
    
    // Alarma si hay errores frecuentes
    await this.cloudWatch.putMetricAlarm({
      AlarmName: 'DriCloud-HighErrorRate',
      ComparisonOperator: 'GreaterThanThreshold',
      EvaluationPeriods: 2,
      MetricName: 'ErrorCount',
      Namespace: 'GUA/DriCloud',
      Period: 300,
      Statistic: 'Sum',
      Threshold: 5,
      ActionsEnabled: true,
      AlarmActions: ['arn:aws:sns:eu-west-1:123456789012:dricloud-alerts']
    }).promise();
  }
  
  private calculateRefreshFrequency(stats: any): number {
    if (!stats.lastRefresh) return 0;
    
    const now = new Date();
    const lastRefresh = new Date(stats.lastRefresh);
    const timeDiff = (now.getTime() - lastRefresh.getTime()) / 1000; // segundos
    
    return stats.refreshCount / Math.max(timeDiff, 1);
  }
}

