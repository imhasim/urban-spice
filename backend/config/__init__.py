"""
Django backend configuration package.
Includes runtime compatibility patches for Python 3.14+.
"""

# Python 3.14+ compatibility patch for Django's BaseContext.__copy__
# In Python 3.14, copy(super()) returns a super proxy object that has no __dict__,
# which causes `duplicate.dicts = self.dicts[:]` to crash with:
# AttributeError: 'super' object has no attribute 'dicts' and no __dict__ for setting new attributes
try:
    from django.template import context

    def _safe_base_context_copy(self):
        obj = object.__new__(self.__class__)
        obj.__dict__.update(self.__dict__)
        obj.dicts = self.dicts[:]
        return obj

    context.BaseContext.__copy__ = _safe_base_context_copy
except Exception:
    pass
