public with sharing class ShobhaProjectController {

    // Fetch Projects by optional Status filter (e.g., Ongoing, Completed)
  @AuraEnabled(cacheable=true)
public static List<Project__c> getProjects(String status) {
    System.debug('🔍 getProjects called with status: ' + status);

    String baseQuery = 'SELECT Id, Name, Status__c, Project_Image__c, Type__c, Location__c, Featured__c, Launch_Date_c__c, Completion_ETA__c, Total_Units__c FROM Project__c';
    List<Project__c> result;

    if (String.isNotBlank(status)) {
        result = Database.query(baseQuery + ' WHERE Status__c = :status ORDER BY Featured__c DESC, Launch_Date_c__c ASC');
    } else {
        result = Database.query(baseQuery + ' ORDER BY Featured__c DESC, Launch_Date_c__c ASC');
    }

    System.debug('✅ Found ' + result.size() + ' projects.');
    return result;
}
@AuraEnabled(cacheable=true)
public static List<Project__c> getFeaturedProjects() {
    return [
        SELECT Id, Name, Project_Image__c, Location__c, Type__c, Total_Units__c, Status__c
        FROM Project__c
        WHERE Featured__c = true
        ORDER BY Launch_Date_c__c DESC
        LIMIT 5
    ];
}

@AuraEnabled(cacheable=true)
    public static List<Property__c> getPropertiesWithImages() {
        return [
            SELECT Id, Name, City__c, Country__c, State__c, Status__c, Unit_No__c,
                   Carpet_Area__c, Price__c, Street__c,
                   (SELECT Id, Property_Image_URL__c, Name FROM PropertyImages__r)
            FROM Property__c
        ];
    }


 @AuraEnabled(cacheable=true)
public static Project__c getProjectById(Id recordId) {
    List<Project__c> projects = [
        SELECT Id, Name, Status__c, Project_Image__c, Type__c, Location__c, Featured__c, Launch_Date_c__c, Completion_ETA__c, Total_Units__c
        FROM Project__c
        WHERE Id = :recordId
        LIMIT 1
    ];
    
    if (projects.isEmpty()) {
        // Return null or throw an AuraHandledException for better error handling in LWC
        throw new AuraHandledException('Project not found with Id: ' + recordId);
        // or simply return null;
    }
    return projects[0];
}
@AuraEnabled(cacheable=true)
public static List<Property__c> getPropertiesByProjectId(Id projectId) {
    return [
        SELECT Id, Name, City__c, Country__c, State__c, Status__c, Unit_No__c,
               Carpet_Area__c, Price__c, Street__c,
               (SELECT Id, Property_Image_URL__c, Name FROM PropertyImages__r)
        FROM Property__c
        WHERE Project__c = :projectId
        ORDER BY Name
    ];
}

@AuraEnabled
public static void updatePaymentStatusToUnderReview(Id paymentId) {
    System.debug('🔄 Updating status to Under Review for payment: ' + paymentId);
    Payment__c p = [SELECT Id, Status__c FROM Payment__c WHERE Id = :paymentId LIMIT 1];
    p.Status__c = 'Under Review';
    update p;
    System.debug('✅ Status updated to: ' + p.Status__c);
}
    @AuraEnabled
public static void uploadFilesToPayment(Id paymentId, String fileName, String base64Data) {
    if (String.isBlank(paymentId) || String.isBlank(fileName) || String.isBlank(base64Data)) {
        throw new AuraHandledException('Missing file data.');
    }

    // Step 1: Insert ContentVersion (creates the file)
    ContentVersion cv = new ContentVersion();
    cv.Title = fileName;
    cv.PathOnClient = fileName;
    cv.VersionData = EncodingUtil.base64Decode(base64Data);
    insert cv;

    // Step 2: Query ContentDocumentId
    ContentVersion insertedCV = [
        SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id
    ];

    // Step 3: Link the file to the Payment__c record
    ContentDocumentLink cdl = new ContentDocumentLink();
    cdl.ContentDocumentId = insertedCV.ContentDocumentId;
    cdl.LinkedEntityId = paymentId;
    cdl.ShareType = 'V'; // View permission
    insert cdl;
}

@AuraEnabled(cacheable=true)
public static Map<Id, List<Map<String, Object>>> getUploadedFilesForPayments(List<Id> paymentIds) {
    Map<Id, List<Map<String, Object>>> result = new Map<Id, List<Map<String, Object>>>();

    if (paymentIds == null || paymentIds.isEmpty()) return result;

    // Get linked ContentDocuments
    List<ContentDocumentLink> links = [
        SELECT ContentDocumentId, LinkedEntityId
        FROM ContentDocumentLink
        WHERE LinkedEntityId IN :paymentIds
    ];

    Set<Id> contentDocIds = new Set<Id>();
    Map<Id, Id> docToPaymentMap = new Map<Id, Id>();
    for (ContentDocumentLink cdl : links) {
        contentDocIds.add(cdl.ContentDocumentId);
        docToPaymentMap.put(cdl.ContentDocumentId, cdl.LinkedEntityId);
    }

    // Get latest ContentVersion for each ContentDocument
    List<ContentVersion> versions = [
        SELECT Id, Title, ContentDocumentId, CreatedDate
        FROM ContentVersion
        WHERE ContentDocumentId IN :contentDocIds
        ORDER BY VersionNumber DESC
    ];

    for (ContentVersion ver : versions) {
        Id paymentId = docToPaymentMap.get(ver.ContentDocumentId);
        if (!result.containsKey(paymentId)) {
            result.put(paymentId, new List<Map<String, Object>>());
        }

        result.get(paymentId).add(new Map<String, Object>{
            'name' => ver.Title,
            'uploadedOn' => String.valueOf(ver.CreatedDate).substring(0, 10),
            'downloadUrl' => '/sfc/servlet.shepherd/document/download/' + ver.ContentDocumentId
        });
    }

    return result;
}



@AuraEnabled(cacheable=true)
public static List<Property__c> getBookedProperties() {
    Id contactId = [SELECT ContactId FROM User WHERE Id = :UserInfo.getUserId()].ContactId;

    if (contactId == null) {
        throw new AuraHandledException('User is not linked to a Contact.');
    }

    return [
        SELECT Id, Name, Buyer_Contact__c, City__c, State__c, Country__c, Street__c,
               Unit_No__c, Status__c, Price__c, Carpet_Area__c, Saleable_Area__c,
               Facing__c, Tower__c, Project__c,
               (SELECT Id, Property_Image_URL__c FROM PropertyImages__r) // <-- FIXED
        FROM Property__c
        WHERE Buyer_Contact__c = :contactId
        ORDER BY CreatedDate DESC
    ];
}


@AuraEnabled(cacheable=true)
public static List<Map<String, Object>> getUserDocuments() {
    Id contactId = [SELECT ContactId FROM User WHERE Id = :UserInfo.getUserId()].ContactId;

    if (contactId == null) {
        throw new AuraHandledException('User is not linked to a Contact.');
    }

    List<Document__c> docs = [
        SELECT Id, Name, Document_Type__c, Expiry_Date__c, CreatedDate,
               (SELECT ContentDocumentId FROM ContentDocumentLinks LIMIT 1)
        FROM Document__c
        WHERE Related_To__c = :contactId
        ORDER BY CreatedDate DESC
    ];

    List<Map<String, Object>> result = new List<Map<String, Object>>();
    for (Document__c doc : docs) {
        Map<String, Object> item = new Map<String, Object>();
        item.put('Id', doc.Id);
        item.put('Name', doc.Name);
        item.put('Document_Type__c', doc.Document_Type__c);
        item.put('Expiry_Date__c', doc.Expiry_Date__c);
        item.put('CreatedDate', doc.CreatedDate);

        if (!doc.ContentDocumentLinks.isEmpty()) {
            String contentDocumentId = doc.ContentDocumentLinks[0].ContentDocumentId;
            ContentVersion ver = [SELECT Id FROM ContentVersion WHERE ContentDocumentId = :contentDocumentId ORDER BY VersionNumber DESC LIMIT 1];
            // Return relative URLs here
            item.put('DownloadUrl', '/sfc/servlet.shepherd/document/download/' + contentDocumentId);
            item.put('PreviewUrl', '/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId=' + ver.Id);
        }

        result.add(item);
    }

    return result;
}





@AuraEnabled
public static Document__c createDocumentRecord(String fileName, String documentType, Date expiryDate, Id contentDocumentId) {
    System.debug('📤 Apex Received: fileName=' + fileName + ', documentType=' + documentType + ', expiryDate=' + expiryDate + ', contentDocumentId=' + contentDocumentId);

    // Get current user's contact
    User currentUser = [SELECT ContactId FROM User WHERE Id = :UserInfo.getUserId()];
    if (currentUser.ContactId == null) {
        throw new AuraHandledException('User is not linked to a Contact.');
    }

    // Create document record
    Document__c doc = new Document__c();
    doc.Document_Type__c = documentType;
    doc.Expiry_Date__c = expiryDate;
    doc.Uploaded_By__c = UserInfo.getUserId();
    doc.Related_To__c = currentUser.ContactId;
    insert doc;
    System.debug('✅ Document__c created: ' + doc.Id);

    // Get latest version of the uploaded document
    List<ContentVersion> versions = [
        SELECT Id, ContentDocumentId 
        FROM ContentVersion 
        WHERE ContentDocumentId = :contentDocumentId 
        ORDER BY VersionNumber DESC 
        LIMIT 1
    ];

    if (versions.isEmpty()) {
        throw new AuraHandledException('No ContentVersion found for ContentDocumentId: ' + contentDocumentId);
    }

    // Create content document link
    ContentDocumentLink cdl = new ContentDocumentLink();
    cdl.ContentDocumentId = versions[0].ContentDocumentId;
    cdl.LinkedEntityId = doc.Id;
    cdl.ShareType = 'V';
    cdl.Visibility = 'AllUsers';
    insert cdl;
    System.debug('🔗 ContentDocumentLink created');

    return doc;
}



public class PropertyPaymentSummary {
    @AuraEnabled public Id propertyId;
    @AuraEnabled public String propertyName;
    @AuraEnabled public String unitNo;
    @AuraEnabled public String tower;
    @AuraEnabled public String projectName;
    @AuraEnabled public String imageUrl; // 🖼 New field
    @AuraEnabled public Decimal totalPayable = 0;
    @AuraEnabled public Decimal totalPaid = 0;
    @AuraEnabled public List<PaymentDTO> payments;
}


    public class PaymentDTO {
        @AuraEnabled public Decimal amount;
        @AuraEnabled public Decimal paidAmount;
        @AuraEnabled public String status;
        @AuraEnabled public Date dueDate;
        @AuraEnabled public Integer emiNumber;
    }


@AuraEnabled(cacheable=true)
public static List<PropertyPaymentSummary> getPropertyPaymentSummaries() {
    System.debug('getPropertyPaymentSummaries: Start');
    
    User loggedInUser = [SELECT ContactId FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
    System.debug('Logged in user ContactId: ' + loggedInUser.ContactId);
    if (loggedInUser.ContactId == null) {
        System.debug('No Contact linked to user. Returning empty list.');
        return new List<PropertyPaymentSummary>();
    }

    List<Opportunity> opps = [
        SELECT Id, Interested_Property__c,
               Interested_Property__r.Name,
               Interested_Property__r.Tower__c,
               Interested_Property__r.Unit_No__c,
               Interested_Property__r.Project__r.Name
        FROM Opportunity
        WHERE ContactId = :loggedInUser.ContactId
    ];
    System.debug('Opportunities fetched: ' + opps.size());

    Map<Id, Property__c> oppIdToProperty = new Map<Id, Property__c>();
    Set<Id> propertyIds = new Set<Id>();
    Set<Id> oppIds = new Set<Id>();

    for (Opportunity opp : opps) {
        if (opp.Interested_Property__c != null) {
            oppIdToProperty.put(opp.Id, opp.Interested_Property__r);
            propertyIds.add(opp.Interested_Property__c);
            oppIds.add(opp.Id);
        }
    }
    System.debug('Property Ids linked to opportunities: ' + propertyIds);
    System.debug('Opportunity Ids: ' + oppIds);

    if (oppIds.isEmpty()) {
        System.debug('No opportunities with properties found. Returning empty list.');
        return new List<PropertyPaymentSummary>();
    }

    Map<Id, String> propertyIdToImageUrl = new Map<Id, String>();
    for (Property_Image__c img : [
        SELECT Property__c, Property_Image_URL__c
        FROM Property_Image__c
        WHERE Property__c IN :propertyIds
        ORDER BY CreatedDate ASC
    ]) {
        if (!propertyIdToImageUrl.containsKey(img.Property__c)) {
            propertyIdToImageUrl.put(img.Property__c, img.Property_Image_URL__c);
        }
    }
    System.debug('Property images fetched: ' + propertyIdToImageUrl);

    List<Payment__c> payments = [
        SELECT Id, Amount__c, Paid_Amount__c, Status__c, Payment_Due_Date__c,
               EMI_Number__c, Opportunity__c
        FROM Payment__c
        WHERE Opportunity__c IN :oppIds
        ORDER BY EMI_Number__c ASC, Payment_Due_Date__c ASC
    ];
    System.debug('Payments fetched for opportunities: ' + payments.size());

    Map<Id, PropertyPaymentSummary> summaries = new Map<Id, PropertyPaymentSummary>();

    for (Payment__c pay : payments) {
        Property__c prop = oppIdToProperty.get(pay.Opportunity__c);
        if (prop == null) {
            System.debug('Skipping payment ' + pay.Id + ' because Opportunity ' + pay.Opportunity__c + ' has no linked property.');
            continue;
        }

        if (!summaries.containsKey(prop.Id)) {
            PropertyPaymentSummary summary = new PropertyPaymentSummary();
            summary.propertyId = prop.Id;
            summary.propertyName = prop.Name;
            summary.unitNo = prop.Unit_No__c;
            summary.tower = prop.Tower__c;
            summary.projectName = prop.Project__r != null ? prop.Project__r.Name : '';
            summary.imageUrl = propertyIdToImageUrl.get(prop.Id);
            summary.payments = new List<PaymentDTO>();
            summaries.put(prop.Id, summary);
        }

        PropertyPaymentSummary propSummary = summaries.get(prop.Id);
        propSummary.totalPayable += (pay.Amount__c != null ? pay.Amount__c : 0);
        propSummary.totalPaid += (pay.Paid_Amount__c != null ? pay.Paid_Amount__c : 0);

        PaymentDTO dto = new PaymentDTO();
        dto.amount = pay.Amount__c;
        dto.paidAmount = pay.Paid_Amount__c;
        dto.status = pay.Status__c;
        dto.dueDate = pay.Payment_Due_Date__c;
        dto.emiNumber = (pay.EMI_Number__c != null) ? Integer.valueOf(pay.EMI_Number__c) : null;
        propSummary.payments.add(dto);
    }

    System.debug('Returning ' + summaries.size() + ' property payment summaries.');
    return summaries.values();
}



@AuraEnabled(cacheable=true)
public static List<Payment__c> getCustomerPaymentsByProperty(Id propertyId) {
    System.debug('getCustomerPaymentsByProperty: Start');
    System.debug('Property Id passed: ' + propertyId);

    // Get logged-in user's ContactId
    Id contactId = [SELECT ContactId FROM User WHERE Id = :UserInfo.getUserId()].ContactId;
    if (contactId == null) {
        System.debug('No Contact linked to user.');
        throw new AuraHandledException('User is not linked to a Contact.');
    }

    // Fetch Opportunities linked to Contact and the given Property
    List<Opportunity> opps = [
        SELECT Id
        FROM Opportunity
     WHERE ContactId = :contactId AND Interested_Property__c = :propertyId
    ];
    List<Id> oppIds = new List<Id>();
    for (Opportunity opp : opps) {
        oppIds.add(opp.Id);
    }

    if (oppIds.isEmpty()) {
        System.debug('No matching Opportunities found for contact and property.');
        return new List<Payment__c>();
    }

    // Fetch related Payments
    List<Payment__c> payments = [
        SELECT Id,
               Amount__c,
               Paid_Amount__c,
               Status__c,
               QR_Code_URL__c,
               Mode_of_Payment__c,
               Downpayment__c,
               Interest__c,
               Installment_Months__c,
               Total_Payable_Calculated_c__c,
               Payment_Due_Date__c,
               Monthly_EMI__c,
               EMI_Number__c,
               Opportunity__c,
               Opportunity__r.Name,
              Opportunity__r.Interested_Property__r.Name,
               CreatedDate
        FROM Payment__c
        WHERE Opportunity__c IN :oppIds
        ORDER BY EMI_Number__c ASC, Payment_Due_Date__c ASC
    ];

    System.debug('Payments fetched: ' + payments.size());
    return payments;
}


}