(function() {
    'use strict';

    const col = Layer8ColumnFactory;
    const enums = L8EventsEnums;

    window.L8EventsArchiveViewer = {
        getArchivedAlarmColumns: function() {
            var columns = [
                ...col.status('severity', 'Severity', null, enums.render.severity),
                ...col.col('name', 'Name'),
                ...col.col('sourceName', 'Source'),
                ...col.status('state', 'State', null, enums.render.alarmState),
                ...col.date('firstOccurrence', 'First Occurrence'),
                ...col.date('clearedAt', 'Cleared At'),
                ...col.date('archivedAt', 'Archived At'),
                ...col.col('archivedBy', 'Archived By'),
                ...col.col('archiveReason', 'Reason')
            ];
            // Mobile card display (desktop table ignores these)
            columns[1].primary = true;   // name
            columns[0].secondary = true; // severity
            return columns;
        },

        getArchivedEventColumns: function() {
            var columns = [
                ...col.date('occurredAt', 'Timestamp'),
                ...col.enum('category', 'Category', null, enums.render.eventCategory),
                ...col.col('eventType', 'Type'),
                ...col.status('severity', 'Severity', null, enums.render.severity),
                ...col.col('sourceName', 'Source'),
                ...col.col('message', 'Message'),
                ...col.date('archivedAt', 'Archived At'),
                ...col.col('archivedBy', 'Archived By')
            ];
            // Mobile card display (desktop table ignores these)
            columns[2].primary = true;   // eventType
            columns[3].secondary = true; // severity
            return columns;
        }
    };
})();
