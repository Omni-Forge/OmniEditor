// Infrastructure type definitions with categories and metadata
export interface PropertyDefinition {
  type: 'string' | 'number' | 'boolean' | 'select';
  label: string;
  description?: string;
  required?: boolean;
  default?: any;
  options?: Array<{value: string; label: string}>; // For select type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export const INFRA_TYPES = {
  compute: {
    aws_instance: {
      name: 'EC2 Instance',
      category: 'compute',
      description: 'Amazon EC2 Virtual Machine',
      properties: {
        instance_type: {
          type: 'select',
          label: 'Instance Type',
          description: 'The instance type defines CPU, memory, and networking capacity',
          required: true,
          options: [
            { value: 't3.micro', label: 't3.micro (2 vCPU, 1 GiB RAM)' },
            { value: 't3.small', label: 't3.small (2 vCPU, 2 GiB RAM)' },
            { value: 't3.medium', label: 't3.medium (2 vCPU, 4 GiB RAM)' }
          ],
          default: 't3.micro'
        },
        ami_id: {
          type: 'string',
          label: 'AMI ID',
          description: 'The ID of the Amazon Machine Image to use',
          required: true,
          validation: {
            pattern: '^ami-[a-z0-9]{17}$'
          }
        },
        root_volume_size: {
          type: 'number',
          label: 'Root Volume Size (GB)',
          description: 'Size of the root EBS volume in gigabytes',
          default: 8,
          validation: {
            min: 8,
            max: 16384
          }
        }
      }
    },
    aws_lambda: {
      name: 'Lambda Function',
      category: 'compute',
      description: 'Serverless Function',
      properties: {
        runtime: {
          type: 'select',
          label: 'Runtime',
          required: true,
          options: [
            { value: 'nodejs18.x', label: 'Node.js 18' },
            { value: 'python3.9', label: 'Python 3.9' },
            { value: 'java11', label: 'Java 11' }
          ]
        },
        memory_size: {
          type: 'number',
          label: 'Memory (MB)',
          description: 'Amount of memory allocated to the function',
          default: 128,
          validation: {
            min: 128,
            max: 10240
          }
        },
        timeout: {
          type: 'number',
          label: 'Timeout (seconds)',
          description: 'Maximum execution time',
          default: 3,
          validation: {
            min: 1,
            max: 900
          }
        }
      }
    },
    ecs_service: {
      name: 'ECS Service',
      category: 'compute',
      description: 'Container Service',
      properties: {
        task_definition: {
          type: 'string',
          label: 'Task Definition',
          required: true,
          description: 'ARN of the task definition'
        },
        desired_count: {
          type: 'number',
          label: 'Desired Count',
          description: 'Number of tasks to run',
          default: 1,
          validation: {
            min: 0,
            max: 1000
          }
        }
      }
    }
  },
  storage: {
    aws_s3: {
      name: 'S3 Bucket',
      category: 'storage',
      description: 'Object Storage',
      properties: {
        versioning: {
          type: 'boolean',
          label: 'Versioning',
          description: 'Enable object versioning',
          default: false
        },
        encryption: {
          type: 'select',
          label: 'Encryption',
          options: [
            { value: 'AES256', label: 'SSE-S3' },
            { value: 'aws:kms', label: 'SSE-KMS' }
          ],
          default: 'AES256'
        }
      }
    },
    aws_ebs: {
      name: 'EBS Volume',
      category: 'storage',
      description: 'Block Storage',
      properties: {
        volume_type: {
          type: 'select',
          label: 'Volume Type',
          options: [
            { value: 'gp3', label: 'General Purpose SSD (gp3)' },
            { value: 'io2', label: 'Provisioned IOPS SSD (io2)' }
          ],
          default: 'gp3'
        },
        size: {
          type: 'number',
          label: 'Size (GB)',
          required: true,
          validation: {
            min: 1,
            max: 16384
          }
        }
      }
    }
  },
  network: {
    aws_vpc: {
      name: 'VPC',
      category: 'network',
      description: 'Virtual Private Cloud',
      properties: {
        cidr_block: {
          type: 'string',
          label: 'CIDR Block',
          required: true,
          validation: {
            pattern: '^([0-9]{1,3}\\.){3}[0-9]{1,3}(\\/([0-9]|[1-2][0-9]|3[0-2]))$'
          }
        },
        enable_dns_hostnames: {
          type: 'boolean',
          label: 'Enable DNS Hostnames',
          default: true
        }
      }
    },
    aws_subnet: {
      name: 'Subnet',
      category: 'network',
      description: 'Network Subnet',
      properties: {
        cidr_block: {
          type: 'string',
          label: 'CIDR Block',
          required: true,
          validation: {
            pattern: '^([0-9]{1,3}\\.){3}[0-9]{1,3}(\\/([0-9]|[1-2][0-9]|3[0-2]))$'
          }
        },
        availability_zone: {
          type: 'select',
          label: 'Availability Zone',
          required: true,
          options: [
            { value: 'us-east-1a', label: 'us-east-1a' },
            { value: 'us-east-1b', label: 'us-east-1b' },
            { value: 'us-east-1c', label: 'us-east-1c' }
          ]
        }
      }
    },
    aws_security_group: {
      name: 'Security Group',
      category: 'network',
      description: 'Firewall Rules',
      properties: {
        vpc_id: {
          type: 'string',
          label: 'VPC ID',
          required: true
        },
        description: {
          type: 'string',
          label: 'Description',
          default: 'Managed by Infrastructure Editor'
        }
      }
    }
  },
  database: {
    aws_rds: {
      name: 'RDS Instance',
      category: 'database',
      description: 'Relational Database',
      properties: {
        engine: {
          type: 'select',
          label: 'Database Engine',
          required: true,
          options: [
            { value: 'mysql', label: 'MySQL' },
            { value: 'postgres', label: 'PostgreSQL' },
            { value: 'aurora', label: 'Aurora' }
          ]
        },
        instance_class: {
          type: 'select',
          label: 'Instance Class',
          required: true,
          options: [
            { value: 'db.t3.micro', label: 'db.t3.micro' },
            { value: 'db.t3.small', label: 'db.t3.small' },
            { value: 'db.t3.medium', label: 'db.t3.medium' }
          ]
        },
        allocated_storage: {
          type: 'number',
          label: 'Allocated Storage (GB)',
          default: 20,
          validation: {
            min: 20,
            max: 65536
          }
        },
        multi_az: {
          type: 'boolean',
          label: 'Multi-AZ Deployment',
          default: false
        }
      }
    },
    aws_dynamodb: {
      name: 'DynamoDB Table',
      category: 'database',
      description: 'NoSQL Database',
      properties: {
        billing_mode: {
          type: 'select',
          label: 'Billing Mode',
          options: [
            { value: 'PROVISIONED', label: 'Provisioned' },
            { value: 'PAY_PER_REQUEST', label: 'On-Demand' }
          ],
          default: 'PAY_PER_REQUEST'
        },
        hash_key: {
          type: 'string',
          label: 'Partition Key',
          required: true
        },
        range_key: {
          type: 'string',
          label: 'Sort Key',
          required: false
        }
      }
    },
    aws_elasticache: {
      name: 'ElastiCache',
      category: 'database',
      description: 'In-Memory Cache',
      properties: {
        engine: {
          type: 'select',
          label: 'Engine',
          required: true,
          options: [
            { value: 'redis', label: 'Redis' },
            { value: 'memcached', label: 'Memcached' }
          ]
        },
        node_type: {
          type: 'select',
          label: 'Node Type',
          required: true,
          options: [
            { value: 'cache.t3.micro', label: 'cache.t3.micro' },
            { value: 'cache.t3.small', label: 'cache.t3.small' },
            { value: 'cache.t3.medium', label: 'cache.t3.medium' }
          ]
        },
        num_cache_nodes: {
          type: 'number',
          label: 'Number of Nodes',
          default: 1,
          validation: {
            min: 1,
            max: 20
          }
        }
      }
    }
  }
};
  
  export interface Connection {
    id: string;
    fromNode: string;
    toNode: string;
    fromPoint: Point;
    toPoint: Point;
    type: string;
  }
  
  export interface Point {
    x: number;
    y: number;
  }