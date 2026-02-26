import * as React from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  GridItem,
  GridItemProps,
} from '@patternfly/react-core';
import {
  QueryBrowser,
  usePrometheusPoll,
  PrometheusEndpoint,
} from '@openshift-console/dynamic-plugin-sdk';

type ResourceMetricsDashboardCardProps = {
  namespace?: string;
  title: string;
  queries: string[];
  xl?: GridItemProps['xl'];
  lg?: GridItemProps['lg'];
  className?: string;
  isStack?: boolean;
  units?: string;
};

const ResourceMetricsCard: React.FC<ResourceMetricsDashboardCardProps> = ({
  namespace,
  title,
  queries,
  xl = 6,
  lg = 12,
  className,
  isStack = false,
  units,
}) => {
  // Poll for the metric to check if data is available
  const [response, loaded] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: queries?.[0],
    namespace,
  });

  // Check if data exists
  const hasData = loaded && response?.data?.result && response.data.result.length > 0;

  // Only render if data is available
  if (!hasData) {
    return null;
  }

  return (
    <GridItem xl={xl} lg={lg}>
      <Card className={`resource-metrics-dashboard__card ${className || ''}`}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardBody className="resource-metrics-dashboard__card-body">
          <QueryBrowser
            queries={queries}
            namespace={namespace}
            disableZoom
            hideControls
            isStack={isStack}
            units={units}
          />
        </CardBody>
      </Card>
    </GridItem>
  );
};

export default ResourceMetricsCard;
