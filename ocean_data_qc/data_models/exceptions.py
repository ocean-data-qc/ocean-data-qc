# -*- coding: utf-8 -*-
#########################################################################
#    License, authors, contributors and copyright information at:       #
#    AUTHORS and LICENSE files at the root folder of this application   #
#########################################################################

# TODO: send the message to the electron interface if an error happends
#       even the uncaught errors

class ValidationError(Exception):
    def __init__(self, value):
        print('CONSTRUCTOR EXECUTION')
        self.value = value

        # send the message to the interface through bokeh?

    def __str__(self):
        return repr(
            'VALIDATION_ERROR: {}'.format(self.value)  # TODO: extract the error in tools.js
                                                       #       and show the traceback hidden with some button
        )

class ManualException(Exception):
    def __init__(self, value):
        print('MANUAL ERROR')
        self.value = value

    def __str__(self):
        return repr(
            'MANUAL ERROR: {}'.format(self.value)
        )



# class OverridingException(Exception):
#     def str_override(self):
#         """
#         Override the output with a fixed string
#         """

#         return "Override!"

#     def reraise(exception):
#         """
#         Re-raise an exception and override its output
#         """

#         exType = type(exception)
#         newExType = type(exType.__name__ + "_Override", (exType,), { '__str__': str_override})
#         exception.__class__ = newExType

#         # Re-raise and remove ourselves from the stack trace.
#         raise exception(None, sys.exc_info()[-1])

#     def test():
#         """
#         Should output "Override!" Actually outputs "Bah Humbug"
#         """
#         try:
#             try:
#                 raise Exception("Bah Humbug")
#             except Exception, e:
#                 reraise(e, "Said Scrooge")
#         except Exception, e:
#             print e


# from exceptions import ManualException
# import sys

# Capture all the errors, send a parameter to the errors in order to send the message to electron
# The most important is to stop the execution and rollback the operations

# try:
#     n = 9 / 0
# except Exception:
#     tb = sys.exc_info()[2]
#     raise ManualException('-----------ZEROOO EROOOOOOOOR').with_traceback(tb)

# raise ManualError('-------- MANUAAAAL!!')

# # it should print the message in the logger and send to electron the message as well

# raise ValidationError('Error!!')

# # the execution stops after the error is run

# exit()