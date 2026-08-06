(function() {
    'use strict';

    const col = Layer8ColumnFactory;
    const f = Layer8FormFactory;
    const enums = L8NotifyEnums;

    // Data-only component: no render()/DOM handling. NotifyRecord is immutable
    // (PUT is rejected server-side), so consumers MUST open the detail form via
    // Layer8DForms.openViewForm(...), never openEditForm(...).
    window.L8NotifyDeliveryLog = {
        getColumns: function(options) {
            const cols = [];
            cols.push(...col.date('sentAt', 'Timestamp'));
            if (!options || options.showChannel !== false) {
                cols.push(...col.enum('channel', 'Channel', null, enums.render.channel));
            }
            // Mobile card display (desktop table ignores these). endpoint is the
            // natural card title, but it's only present when showTarget isn't
            // false — status is always present, so it's always the secondary.
            if (!options || options.showTarget !== false) {
                const endpointCol = col.col('endpoint', 'Endpoint');
                endpointCol[0].primary = true;
                cols.push(...endpointCol);
            }
            const statusCol = col.status('status', 'Status', null, enums.render.deliveryStatus);
            statusCol[0].secondary = true;
            cols.push(...statusCol);
            cols.push(...col.number('httpStatus', 'HTTP Status'));
            cols.push(...col.number('attempt', 'Attempt'));
            cols.push(...col.col('errorMessage', 'Error'));
            return cols;
        },

        getFormDefinition: function() {
            return f.form('Delivery Details', [
                f.section('Delivery', [
                    ...f.select('channel', 'Channel', enums.NOTIFY_CHANNEL.enum),
                    ...f.text('endpoint', 'Endpoint'),
                    ...f.text('subject', 'Subject'),
                    ...f.textarea('message', 'Message')
                ]),
                f.section('Outcome', [
                    ...f.select('status', 'Status', enums.DELIVERY_STATUS.enum),
                    ...f.number('httpStatus', 'HTTP Status'),
                    ...f.number('attempt', 'Attempt'),
                    ...f.text('errorMessage', 'Error')
                ]),
                f.section('Timing', [
                    ...f.date('requestedAt', 'Requested At'),
                    ...f.date('sentAt', 'Sent At')
                ])
            ]);
        }
    };
})();
