import * as cdk from '@aws-cdk/core';
import * as appsync from '@aws-cdk/aws-appsync';
import * as ddb from '@aws-cdk/aws-dynamodb';

export class LollyBackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    ///APPSYNC API gives you a graphql api with api key
    const api = new appsync.GraphqlApi(this, "GRAPHQL_API", {
      name: 'lolly-api',
      schema: appsync.Schema.fromAsset('schema/schema.gql'),       ///Path specified for lambda
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,     ///Defining Authorization Type
        },
      },
      xrayEnabled: true                                             ///Enables xray debugging
    })

    ///Print Graphql Api Url on console after deploy
    new cdk.CfnOutput(this, "APIGraphQlURL", {
      value: api.graphqlUrl
    })

    ///Print API Key on console after deploy
    new cdk.CfnOutput(this, "GraphQLAPIKey", {
      value: api.apiKey || ''
    });

    
    ///Defining a DynamoDB Table
    const dynamoDBTable = new ddb.Table(this, 'Table', {
      partitionKey: {
        name: 'id',
        type: ddb.AttributeType.STRING,
      },
    });
    ///Attaching Datasource to api
    const db_data_source = api.addDynamoDbDataSource('DataSources', dynamoDBTable);





    db_data_source.createResolver({
      typeName: "Mutation",
      fieldName: "createLolly",
      requestMappingTemplate : appsync.MappingTemplate.dynamoDbPutItem(
        appsync.PrimaryKey.partition('id').auto(),        ///Create an autoID for your primary Key Id
        appsync.Values.projecting()                       ///Add Remaining input values
      ),
        responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem()   ////Mapping template for a single result item from DynamoDB.
    })


    db_data_source.createResolver({
      typeName: "Query",
      fieldName: "getLollies",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbScanTable(),      ///Mapping template to scan a DynamoDB table to fetch all entries.
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),    ////Mapping template for a result list from DynamoDB.
    })

    db_data_source.createResolver({
      typeName: "Query",
      fieldName: "getLollyByID",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem('id', 'id'),   ///Mapping template to delete a single item from a DynamoDB table.
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem()             ////Mapping template for a single result item from DynamoDB.
    });

    db_data_source.createResolver({
      typeName: "Mutation",
      fieldName: "deleteLolly",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbDeleteItem('id', 'id'),   ///Mapping template to delete a single item from a DynamoDB table.
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem()             ////Mapping template for a single result item from DynamoDB.
    });
  
  }
}
