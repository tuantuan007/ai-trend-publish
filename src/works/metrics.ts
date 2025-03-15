import { Logger } from "@zilla/logger";

const logger = new Logger("workflow-metrics");

export interface StepMetric {
  stepId: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: "success" | "failure";
  attempts: number;
  error?: string;
}

export interface WorkflowMetric {
  workflowId: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: "success" | "failure";
  steps: StepMetric[];
  error?: string;
}

export class MetricsCollector {
  private metrics: Map<string, WorkflowMetric> = new Map();
  private currentWorkflow?: string;

  startWorkflow(workflowId: string): void {
    this.currentWorkflow = workflowId;
    this.metrics.set(workflowId, {
      workflowId,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      status: "success",
      steps: [],
    });
    logger.info(`Workflow ${workflowId} started`);
  }

  endWorkflow(workflowId: string, error?: Error): void {
    const metric = this.metrics.get(workflowId);
    if (!metric) return;

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    if (error) {
      metric.status = "failure";
      metric.error = error.message;
      logger.error(`Workflow ${workflowId} failed: ${error.message}`);
    } else {
      logger.info(`Workflow ${workflowId} completed successfully`);
    }

    // 计算统计信息
    const stats = this.calculateStats(metric);
    logger.info("Workflow statistics:", stats);
  }

  recordStep(
    workflowId: string,
    stepMetric: Omit<StepMetric, "duration">,
  ): void {
    const metric = this.metrics.get(workflowId);
    if (!metric) return;

    const duration = stepMetric.endTime - stepMetric.startTime;
    const fullStepMetric: StepMetric = {
      ...stepMetric,
      duration,
    };

    metric.steps.push(fullStepMetric);
  }

  getMetrics(workflowId: string): WorkflowMetric | undefined {
    return this.metrics.get(workflowId);
  }

  getAllMetrics(): WorkflowMetric[] {
    return Array.from(this.metrics.values());
  }

  private calculateStats(metric: WorkflowMetric) {
    const steps = metric.steps;
    const totalSteps = steps.length;
    const failedSteps = steps.filter((s) => s.status === "failure").length;
    const totalAttempts = steps.reduce((sum, s) => sum + s.attempts, 0);
    const avgDuration = steps.reduce((sum, s) => sum + s.duration, 0) /
      totalSteps;

    return {
      totalSteps,
      failedSteps,
      successRate: ((totalSteps - failedSteps) / totalSteps) * 100,
      totalAttempts,
      avgAttemptsPerStep: totalAttempts / totalSteps,
      avgStepDuration: avgDuration,
      totalDuration: metric.duration,
    };
  }
}
