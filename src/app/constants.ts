// Infrastructure type definitions with categories and metadata
export const INFRA_TYPES = {
    compute: {
      aws_instance: { 
        name: 'EC2 Instance', 
        category: 'compute',
        description: 'Amazon EC2 Virtual Machine'
      },
      aws_lambda: { 
        name: 'Lambda Function', 
        category: 'compute',
        description: 'Serverless Function'
      },
      ecs_service: { 
        name: 'ECS Service', 
        category: 'compute',
        description: 'Container Service'
      }
    },
    storage: {
      aws_s3: { 
        name: 'S3 Bucket', 
        category: 'storage',
        description: 'Object Storage'
      },
      aws_ebs: { 
        name: 'EBS Volume', 
        category: 'storage',
        description: 'Block Storage'
      }
    },
    network: {
      aws_vpc: { 
        name: 'VPC', 
        category: 'network',
        description: 'Virtual Private Cloud'
      },
      aws_subnet: { 
        name: 'Subnet', 
        category: 'network',
        description: 'Network Subnet'
      },
      aws_security_group: {
        name: 'Security Group',
        category: 'network',
        description: 'Firewall Rules'
      }
    },
    database: {
      aws_rds: { 
        name: 'RDS Instance', 
        category: 'database',
        description: 'Relational Database'
      },
      aws_dynamodb: { 
        name: 'DynamoDB Table', 
        category: 'database',
        description: 'NoSQL Database'
      },
      aws_elasticache: {
        name: 'ElastiCache',
        category: 'database',
        description: 'In-Memory Cache'
      }
    }
  };
  
  export interface Node {
    id: string;
    type: string;
    name: string;
    position: {
      x: number;
      y: number;
    };
    config: {
      type: string;
      category: string;
      properties: Record<string, any>;
    };
  }
  
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